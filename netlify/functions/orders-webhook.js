import crypto from 'crypto';

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Shopify-Hmac-Sha256',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SHOP_DOMAIN = process.env.SHOPIFY_DOMAIN || process.env.VITE_SHOPIFY_DOMAIN;
const ADMIN_TOKEN = process.env.ADMIN_API_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
const API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION || process.env.VITE_SHOPIFY_API_VERSION || '2025-04';
const WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_WEBHOOK_SHARED_SECRET;

const isConfigured = Boolean(SHOP_DOMAIN && ADMIN_TOKEN && WEBHOOK_SECRET);
const ADMIN_BASE_URL = `https://${SHOP_DOMAIN}/admin/api/${API_VERSION}`;

async function setCustomerCartState(customerId, cartState = { items: [], note: '' }) {
  if (!isConfigured) {
    throw new Error('Shopify Admin API or webhook secret not configured');
  }

  const mutation = `
    mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id }
        userErrors { field message }
      }
    }
  `;

  const metafield = {
    ownerId: customerId,
    namespace: 'b2keeper',
    key: 'saved_cart',
    type: 'json',
    value: JSON.stringify({
      items: Array.isArray(cartState.items) ? cartState.items : [],
      note: cartState.note || '',
      updatedAt: new Date().toISOString(),
    }),
  };

  const response = await fetch(`${ADMIN_BASE_URL}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ADMIN_TOKEN,
    },
    body: JSON.stringify({ query: mutation, variables: { metafields: [metafield] } }),
  });

  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON response from Shopify Admin API: ${text}`);
  }

  const userErrors = json?.data?.metafieldsSet?.userErrors;
  if (userErrors?.length) {
    throw new Error(userErrors.map((err) => err.message).join(', '));
  }

  return true;
}

function verifyWebhookSignature(rawBody, hmacHeader) {
  if (!WEBHOOK_SECRET) return false;
  if (!hmacHeader) return false;
  const digest = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody, 'utf8').digest('base64');
  return crypto.timingSafeEqual(Buffer.from(digest, 'utf8'), Buffer.from(hmacHeader, 'utf8'));
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: HEADERS,
      body: 'ok',
    };
  }

  if (!isConfigured) {
    console.error('orders-webhook: missing configuration');
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: 'Shopify Admin API not configured' }),
    };
  }

  const hmacHeader = event.headers['x-shopify-hmac-sha256'] || event.headers['X-Shopify-Hmac-Sha256'];
  const rawBody = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '');

  if (!verifyWebhookSignature(rawBody, hmacHeader)) {
    console.warn('orders-webhook: invalid HMAC signature');
    return {
      statusCode: 401,
      headers: HEADERS,
      body: JSON.stringify({ success: false, message: 'Invalid signature' }),
    };
  }

  try {
    const payload = JSON.parse(rawBody);
    const customerId = payload?.customer?.id;

    if (!customerId) {
      return {
        statusCode: 200,
        headers: HEADERS,
        body: JSON.stringify({ success: true, message: 'No customer associated with order' }),
      };
    }

    await setCustomerCartState(customerId, { items: [], note: '' });

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('orders-webhook error', error);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};
