const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const SHOP_DOMAIN = process.env.SHOPIFY_DOMAIN || process.env.VITE_SHOPIFY_DOMAIN;
const ADMIN_TOKEN = process.env.ADMIN_API_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
const API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION || process.env.VITE_SHOPIFY_API_VERSION || '2025-04';

const LOYALTY_POINTS_PER_POUND = Number.parseFloat(process.env.VITE_LOYALTY_POINTS_PER_POUND || process.env.LOYALTY_POINTS_PER_POUND || '1');
const LOYALTY_PENNY_PER_POINT = Number.parseFloat(process.env.VITE_LOYALTY_PENNY_PER_POINT || process.env.LOYALTY_PENNY_PER_POINT || '10');
const LOYALTY_THRESHOLD_POINTS = Number.parseInt(process.env.VITE_LOYALTY_THRESHOLD_POINTS || process.env.LOYALTY_THRESHOLD_POINTS || '0', 10);
const LOYALTY_CURRENCY = process.env.VITE_LOYALTY_CURRENCY || process.env.LOYALTY_CURRENCY || 'GBP';
const LOYALTY_MAX_DISCOUNT_PERCENT = Number.parseFloat(process.env.VITE_LOYALTY_MAX_DISCOUNT_PERCENT || process.env.LOYALTY_MAX_DISCOUNT_PERCENT || '15');

const isConfigured = Boolean(SHOP_DOMAIN && ADMIN_TOKEN);

const ADMIN_BASE_URL = `https://${SHOP_DOMAIN}/admin/api/${API_VERSION}`;

async function adminFetch(query, variables = {}) {
  if (!isConfigured) {
    throw new Error('Shopify Admin API not configured');
  }

  const response = await fetch(`${ADMIN_BASE_URL}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ADMIN_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON response from Shopify Admin API: ${text}`);
  }

  if (!response.ok) {
    const message = json.errors?.[0]?.message || `${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  if (json.errors?.length) {
    throw new Error(json.errors.map(e => e.message).join(', '));
  }

  return json.data;
}

async function adminRestFetch(path, { method = 'GET', headers = {}, body } = {}) {
  if (!isConfigured) {
    throw new Error('Shopify Admin API not configured');
  }

  const url = `${ADMIN_BASE_URL}/${path.replace(/^\/+/, '')}`;
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Shopify-Access-Token': ADMIN_TOKEN,
      ...headers,
    },
    body,
  });

  const text = await response.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch (err) {
      throw new Error(`Invalid JSON response from Shopify Admin REST API: ${text}`);
    }
  }

  if (!response.ok) {
    const message = json?.errors || json?.error || json?.message || `${response.status} ${response.statusText}`;
    const formattedMessage = Array.isArray(message)
      ? message.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join(', ')
      : (typeof message === 'string' ? message : JSON.stringify(message));
    throw new Error(formattedMessage);
  }

  return json;
}

const toNumericId = (id) => {
  if (typeof id !== 'string') return id;
  const parts = id.split('/');
  return parts[parts.length - 1];
};

const ensureGlobalId = (id, type = 'MailingAddress') => {
  if (!id) return null;
  if (typeof id === 'string' && id.startsWith('gid://')) {
    return id;
  }
  return `gid://shopify/${type}/${id}`;
};

const normalizeAddressForClient = (address) => {
  if (!address) return null;
  return {
    id: ensureGlobalId(address.id),
    firstName: address.firstName ?? address.first_name ?? null,
    lastName: address.lastName ?? address.last_name ?? null,
    company: address.company ?? null,
    address1: address.address1 ?? null,
    address2: address.address2 ?? null,
    city: address.city ?? null,
    province: address.province ?? null,
    provinceCode: address.provinceCode ?? address.province_code ?? null,
    zip: address.zip ?? null,
    country: address.country ?? null,
    countryCode: address.countryCode ?? address.country_code ?? null,
    phone: address.phone ?? null,
    default: address.default ?? address.isDefault ?? false,
  };
};

const toRestAddressPayload = (address = {}) => {
  const countryCode = address.countryCode ?? address.country_code ?? null;
  const provinceCode = address.provinceCode ?? address.province_code ?? null;

  const mapped = {
    first_name: address.firstName ?? address.first_name ?? null,
    last_name: address.lastName ?? address.last_name ?? null,
    company: address.company ?? null,
    address1: address.address1 ?? null,
    address2: address.address2 ?? null,
    city: address.city ?? null,
    province: address.province ?? null,
    province_code: provinceCode ? String(provinceCode).toUpperCase() : null,
    zip: address.zip ?? null,
    country: address.country ?? null,
    country_code: countryCode ? String(countryCode).toUpperCase() : null,
    phone: address.phone ?? null,
    default: typeof address.default === 'boolean' ? address.default : undefined,
  };

  return Object.fromEntries(
    Object.entries(mapped).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
};

const DEFAULT_LOYALTY_STATE = {
  totalPoints: 0,
  redeemedPoints: 0,
  redemptions: [],
};

const parseJsonSafe = (value, fallback = null) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (err) {
    console.warn('Failed to parse JSON value:', err?.message || err);
    return fallback;
  }
};

const getCustomerOrdersArray = (customer) => {
  if (!customer?.orders) return [];
  if (Array.isArray(customer.orders)) {
    return customer.orders;
  }
  if (Array.isArray(customer.orders.edges)) {
    return customer.orders.edges.map((edge) => edge.node).filter(Boolean);
  }
  return [];
};

const computeLoyaltyPointsFromOrders = (customer) => {
  const orders = getCustomerOrdersArray(customer);
  if (!orders.length || !Number.isFinite(LOYALTY_POINTS_PER_POUND) || LOYALTY_POINTS_PER_POUND <= 0) {
    return { totalPoints: 0, totalSpent: 0 };
  }

  let totalSpent = 0;
  for (const order of orders) {
    const priceSet = order?.currentTotalPriceSet?.shopMoney || order?.totalPrice || order?.totalPriceSet?.shopMoney;
    if (!priceSet) continue;
    const currency = priceSet.currencyCode || LOYALTY_CURRENCY;
    if (currency !== LOYALTY_CURRENCY) continue;
    const amount = Number.parseFloat(priceSet.amount);
    if (Number.isFinite(amount)) {
      totalSpent += amount;
    }
  }

  const totalPoints = Math.max(0, Math.floor(totalSpent * LOYALTY_POINTS_PER_POUND));
  return { totalPoints, totalSpent };
};

const calculateLoyaltySummary = (loyaltyData) => {
  const base = { ...DEFAULT_LOYALTY_STATE, ...(loyaltyData || {}) };
  base.totalPoints = Number.isFinite(base.totalPoints) ? Math.max(0, Math.floor(base.totalPoints)) : 0;
  base.redeemedPoints = Number.isFinite(base.redeemedPoints) ? Math.max(0, Math.floor(base.redeemedPoints)) : 0;
  const availablePoints = Math.max(0, base.totalPoints - base.redeemedPoints);
  const discountValue = Math.max(0, Number.parseFloat(((availablePoints * LOYALTY_PENNY_PER_POINT) / 100).toFixed(2)));
  const thresholdReached = availablePoints >= Math.max(0, LOYALTY_THRESHOLD_POINTS || 0);

  const maxPercent = Number.isFinite(LOYALTY_MAX_DISCOUNT_PERCENT)
    ? Math.max(0, Math.min(100, LOYALTY_MAX_DISCOUNT_PERCENT))
    : 0;
  let maxRedeemablePoints = availablePoints;
  if (availablePoints > 0 && maxPercent > 0 && maxPercent < 100) {
    maxRedeemablePoints = Math.max(1, Math.floor((availablePoints * maxPercent) / 100));
    maxRedeemablePoints = Math.min(maxRedeemablePoints, availablePoints);
  }
  if (availablePoints === 0) {
    maxRedeemablePoints = 0;
  }

  return {
    totalPoints: base.totalPoints,
    redeemedPoints: base.redeemedPoints,
    availablePoints,
    discountValue,
    threshold: Math.max(0, LOYALTY_THRESHOLD_POINTS || 0),
    pennyPerPoint: LOYALTY_PENNY_PER_POINT,
    currency: LOYALTY_CURRENCY,
    redemptions: Array.isArray(base.redemptions) ? base.redemptions : [],
    thresholdReached,
    maxRedeemablePoints,
    maxDiscountPercent: maxPercent,
  };
};

const loyaltyMetafieldInput = (customerId, loyaltyData) => ({
  ownerId: customerId,
  namespace: 'b2keeper',
  key: 'loyalty',
  type: 'json',
  value: JSON.stringify({
    totalPoints: loyaltyData.totalPoints,
    redeemedPoints: loyaltyData.redeemedPoints,
    redemptions: Array.isArray(loyaltyData.redemptions) ? loyaltyData.redemptions : [],
  }),
});

async function setCustomerLoyaltyData(customerId, loyaltyData) {
  const mutation = `
    mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id }
        userErrors { field message }
      }
    }
  `;

  const data = await adminFetch(mutation, { metafields: [loyaltyMetafieldInput(customerId, loyaltyData)] });
  const result = data?.metafieldsSet;
  if (result?.userErrors?.length) {
    throw new Error(result.userErrors.map((err) => err.message).join(', '));
  }
  return loyaltyData;
}

const mergeLoyaltyData = (existing, updates) => {
  return {
    totalPoints: updates.totalPoints ?? existing.totalPoints ?? 0,
    redeemedPoints: updates.redeemedPoints ?? existing.redeemedPoints ?? 0,
    redemptions: updates.redemptions || existing.redemptions || [],
  };
};

const generateLoyaltyCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'B2';
  for (let i = 0; i < 6; i += 1) {
    code += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return code;
};

const CUSTOMER_FRAGMENT = `
  id
  firstName
  lastName
  displayName
  email
  phone
  createdAt
  updatedAt
  tags
  activeCartId: metafield(namespace: "b2keeper", key: "active_cart_id") {
    value
  }
  savedCart: metafield(namespace: "b2keeper", key: "saved_cart") {
    value
  }
  loyalty: metafield(namespace: "b2keeper", key: "loyalty") {
    value
  }
  defaultAddress {
    id
    firstName
    lastName
    company
    address1
    address2
    city
    province
    provinceCode
    zip
    country
    countryCode
    phone
  }
  addresses {
    id
    firstName
    lastName
    company
    address1
    address2
    city
    province
    provinceCode
    zip
    country
    countryCode
    phone
  }
  orders(first: 50, sortKey: CREATED_AT, reverse: true) {
    edges {
      node {
        id
        name
        confirmationNumber
        createdAt
        updatedAt
        processedAt
        displayFinancialStatus
        displayFulfillmentStatus
        currencyCode
        currentTotalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        note
        email
        phone
        tags
        shippingAddress {
          firstName
          lastName
          company
          address1
          address2
          city
          province
          provinceCode
          zip
          country
          countryCode
          phone
        }
        billingAddress {
          firstName
          lastName
          company
          address1
          address2
          city
          province
          provinceCode
          zip
          country
          countryCode
          phone
        }
        fulfillments(first: 10) {
          id
          status
          updatedAt
          estimatedDeliveryAt
          trackingInfo {
            company
            number
            url
          }
        }
        lineItems(first: 50) {
          edges {
            node {
              id
              name
              quantity
              originalUnitPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              discountedTotalSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              variant {
                id
                title
                sku
                image {
                  url
                  altText
                }
              }
            }
          }
        }
      }
    }
  }
`;

async function buildCustomerWithLoyalty(customerNode) {
  if (!customerNode) return null;

  const { totalPoints } = computeLoyaltyPointsFromOrders(customerNode);
  let loyaltyData = parseJsonSafe(customerNode.loyalty?.value, null) || { ...DEFAULT_LOYALTY_STATE };
  let changed = false;

  if (!Number.isFinite(loyaltyData.totalPoints) || loyaltyData.totalPoints !== totalPoints) {
    loyaltyData.totalPoints = totalPoints;
    changed = true;
  }

  if (!Number.isFinite(loyaltyData.redeemedPoints)) {
    loyaltyData.redeemedPoints = 0;
    changed = true;
  }

  if (!Array.isArray(loyaltyData.redemptions)) {
    loyaltyData.redemptions = [];
    changed = true;
  }

  if (loyaltyData.redeemedPoints > loyaltyData.totalPoints) {
    loyaltyData.redeemedPoints = loyaltyData.totalPoints;
    changed = true;
  }

  if (changed) {
    await setCustomerLoyaltyData(customerNode.id, loyaltyData);
    customerNode.loyalty = { value: JSON.stringify(loyaltyData) };
  }

  const normalized = normalizeCustomer(customerNode, { loyaltyDataOverride: loyaltyData });
  normalized.loyalty = calculateLoyaltySummary(loyaltyData);
  normalized.loyaltyData = loyaltyData;
  return normalized;
}

async function getCustomerByEmail(email) {
  const query = `
    query getCustomerByEmail($query: String!) {
      customers(first: 1, query: $query) {
        edges {
          node {
            ${CUSTOMER_FRAGMENT}
          }
        }
      }
    }
  `;

  const data = await adminFetch(query, { query: `email:${email}` });
  const customerNode = data.customers?.edges?.[0]?.node || null;
  return buildCustomerWithLoyalty(customerNode);
}

async function updateCustomerProfile(customerId, profileData) {
  const mutation = `
    mutation updateCustomer($input: CustomerInput!) {
      customerUpdate(input: $input) {
        customer {
          ${CUSTOMER_FRAGMENT}
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      id: customerId,
      ...profileData,
    },
  };

  const data = await adminFetch(mutation, variables);
  const result = data.customerUpdate;
  if (result?.userErrors?.length) {
    throw new Error(result.userErrors.map(e => e.message).join(', '));
  }
  return buildCustomerWithLoyalty(result?.customer);
}

async function createCustomerAddress(customerId, address) {
  const numericCustomerId = toNumericId(customerId);
  const payload = {
    address: toRestAddressPayload(address),
  };

  const data = await adminRestFetch(`customers/${numericCustomerId}/addresses.json`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const result = data?.customer_address;
  if (!result) {
    throw new Error('Failed to create address.');
  }
  return normalizeAddressForClient(result);
}

async function updateCustomerAddress(customerId, addressId, address) {
  const numericCustomerId = toNumericId(customerId);
  const numericAddressId = toNumericId(addressId);

  const payload = {
    address: toRestAddressPayload(address),
  };

  const data = await adminRestFetch(`customers/${numericCustomerId}/addresses/${numericAddressId}.json`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  const result = data?.customer_address;
  if (!result) {
    throw new Error('Failed to update address.');
  }
  return normalizeAddressForClient(result);
}

async function getCustomerById(customerId) {
  const query = `
    query getCustomer($id: ID!) {
      customer(id: $id) {
        ${CUSTOMER_FRAGMENT}
      }
    }
  `;

  const data = await adminFetch(query, { id: customerId });
  return buildCustomerWithLoyalty(data?.customer || null);
}

async function deleteCustomerAddress(customerId, addressId) {
  const numericCustomerId = toNumericId(customerId);
  const numericAddressId = toNumericId(addressId);

  await adminRestFetch(`customers/${numericCustomerId}/addresses/${numericAddressId}.json`, {
    method: 'DELETE',
  });

  return ensureGlobalId(numericAddressId);
}

async function setDefaultAddress(customerId, addressId) {
  const mutation = `
    mutation customerDefaultAddressUpdate($customerId: ID!, $addressId: ID!) {
      customerDefaultAddressUpdate(customerId: $customerId, addressId: $addressId) {
        customer {
          defaultAddress {
            id
            firstName
            lastName
            company
            address1
            address2
            city
            province
            provinceCode
            zip
            country
            countryCode
            phone
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await adminFetch(mutation, {
    customerId,
    addressId,
  });

  const result = data?.customerDefaultAddressUpdate;
  if (result?.userErrors?.length) {
    throw new Error(result.userErrors.map((err) => err.message).join(', '));
  }

  return normalizeAddressForClient(result?.customer?.defaultAddress);
}

const cartMetafieldInput = (customerId, cartState = {}) => ({
  ownerId: customerId,
  namespace: 'b2keeper',
  key: 'saved_cart',
  type: 'json',
  value: JSON.stringify({
    items: Array.isArray(cartState.items) ? cartState.items : [],
    note: cartState.note || '',
    updatedAt: new Date().toISOString(),
  }),
});

async function setCustomerCartState(customerId, cartState) {
  const mutation = `
    mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id }
        userErrors { field message }
      }
    }
  `;

  const data = await adminFetch(mutation, { metafields: [cartMetafieldInput(customerId, cartState)] });
  const result = data?.metafieldsSet;
  if (result?.userErrors?.length) {
    throw new Error(result.userErrors.map((err) => err.message).join(', '));
  }
  return true;
}

async function saveCustomerCartState(customerId, cartState) {
  if (!cartState) {
    return setCustomerCartState(customerId, { items: [], note: '' });
  }
  return setCustomerCartState(customerId, cartState);
}

async function clearCustomerCartState(customerId) {
  return setCustomerCartState(customerId, { items: [], note: '' });
}

async function getOrderDetails(orderId) {
  const query = `
    query getOrder($id: ID!) {
      order(id: $id) {
        id
        name
        confirmationNumber
        createdAt
        updatedAt
        processedAt
        displayFinancialStatus
        displayFulfillmentStatus
        currencyCode
        currentTotalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        currentSubtotalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        currentShippingPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        currentTotalTaxSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        note
        email
        phone
        shippingAddress {
          firstName
          lastName
          company
          address1
          address2
          city
          province
          provinceCode
          zip
          country
          countryCode
          phone
        }
        billingAddress {
          firstName
          lastName
          company
          address1
          address2
          city
          province
          provinceCode
          zip
          country
          countryCode
          phone
        }
        lineItems(first: 50) {
          edges {
            node {
              id
              name
              quantity
              originalUnitPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              discountedTotalSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              variant {
                id
                title
                sku
                image { url altText }
              }
            }
          }
        }
        fulfillments(first: 10) {
          id
          status
          updatedAt
          estimatedDeliveryAt
          trackingInfo {
            company
            number
            url
          }
        }
        transactions {
          id
          status
          kind
          amount
          gateway
          createdAt
        }
      }
    }
  `;

  const data = await adminFetch(query, { id: orderId });
  return data.order || null;
}

async function redeemCustomerPoints(customerId, pointsRequested) {
  if (!customerId) {
    throw new Error('customerId is required');
  }

  const pointsToRedeem = Math.floor(Number(pointsRequested));
  if (!Number.isFinite(pointsToRedeem) || pointsToRedeem <= 0) {
    throw new Error('Invalid points amount');
  }

  const loyaltyThreshold = Math.max(0, LOYALTY_THRESHOLD_POINTS || 0);
  if (loyaltyThreshold > 0 && pointsToRedeem < loyaltyThreshold) {
    throw new Error(`Minimum redemption is ${loyaltyThreshold} points.`);
  }

  const customer = await getCustomerById(customerId);
  if (!customer) {
    throw new Error('Customer not found');
  }

  const loyaltyData = { ...customer.loyaltyData };
  const summary = calculateLoyaltySummary(loyaltyData);

  if (pointsToRedeem > summary.availablePoints) {
    throw new Error('Insufficient loyalty points.');
  }

  const maxRedeemablePoints = summary.maxRedeemablePoints ?? summary.availablePoints;
  if (maxRedeemablePoints <= 0) {
    throw new Error('No loyalty points can be redeemed at this time.');
  }

  if (pointsToRedeem > maxRedeemablePoints) {
    const percentMessage = Number.isFinite(summary.maxDiscountPercent) && summary.maxDiscountPercent > 0
      ? `${summary.maxDiscountPercent}%`
      : '15%';
    throw new Error(`You can redeem at most ${maxRedeemablePoints} points (${percentMessage}) per order.`);
  }

  const discountValue = Number.parseFloat(((pointsToRedeem * LOYALTY_PENNY_PER_POINT) / 100).toFixed(2));
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    throw new Error('Redeemed discount value must be positive.');
  }

  const numericCustomerId = Number(toNumericId(customerId));
  if (!Number.isFinite(numericCustomerId)) {
    throw new Error('Unable to resolve customer ID.');
  }

  const code = generateLoyaltyCode();
  const nowIso = new Date().toISOString();

  const priceRulePayload = {
    price_rule: {
      title: `LOYALTY-${numericCustomerId}-${Date.now()}`,
      target_type: 'line_item',
      target_selection: 'all',
      allocation_method: 'across',
      value_type: 'fixed_amount',
      value: `-${discountValue.toFixed(2)}`,
      customer_selection: 'prerequisite',
      prerequisite_customer_ids: [numericCustomerId],
      starts_at: nowIso,
      usage_limit: 1,
      once_per_customer: false,
    }
  };

  const priceRuleResponse = await adminRestFetch('price_rules.json', {
    method: 'POST',
    body: JSON.stringify(priceRulePayload),
  });

  const priceRuleId = priceRuleResponse?.price_rule?.id;
  if (!priceRuleId) {
    throw new Error('Failed to create loyalty price rule.');
  }

  const discountResponse = await adminRestFetch(`price_rules/${priceRuleId}/discount_codes.json`, {
    method: 'POST',
    body: JSON.stringify({ discount_code: { code } }),
  });

  const discountCode = discountResponse?.discount_code?.code;
  if (!discountCode) {
    throw new Error('Failed to generate discount code.');
  }

  const redemptionRecord = {
    code: discountCode,
    points: pointsToRedeem,
    value: discountValue,
    currency: LOYALTY_CURRENCY,
    priceRuleId,
    createdAt: nowIso,
  };

  const updatedLoyalty = {
    totalPoints: loyaltyData.totalPoints,
    redeemedPoints: (loyaltyData.redeemedPoints || 0) + pointsToRedeem,
    redemptions: [...(Array.isArray(loyaltyData.redemptions) ? loyaltyData.redemptions : []), redemptionRecord].slice(-25),
  };

  await setCustomerLoyaltyData(customerId, updatedLoyalty);

  const updatedSummary = calculateLoyaltySummary(updatedLoyalty);

  return {
    code: discountCode,
    pointsRedeemed: pointsToRedeem,
    discountValue,
    currency: LOYALTY_CURRENCY,
    loyalty: updatedSummary,
  };
}

function normalizeCustomer(customer, { loyaltyDataOverride } = {}) {
  if (!customer) return null;
  const addresses = Array.isArray(customer.addresses)
    ? customer.addresses
    : customer.addresses?.edges?.map(edge => edge.node) || [];
  const savedCart = parseJsonSafe(customer.savedCart?.value, null);
  const loyaltyData = loyaltyDataOverride || parseJsonSafe(customer.loyalty?.value, null) || { ...DEFAULT_LOYALTY_STATE };
  return {
    ...customer,
    addresses,
    savedCart,
    activeCartId: customer.activeCartId?.value || null,
    loyaltyData,
  };
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' };
  }

  if (event.httpMethod === 'GET') {
    return {
      statusCode: isConfigured ? 200 : 503,
      headers: HEADERS,
      body: JSON.stringify({ configured: isConfigured }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  if (!isConfigured) {
    return {
      statusCode: 503,
      headers: HEADERS,
      body: JSON.stringify({ error: 'Shopify Admin API not configured' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { operation, payload = {} } = body;

    if (!operation) {
      return {
        statusCode: 400,
        headers: HEADERS,
        body: JSON.stringify({ error: 'Missing operation' }),
      };
    }

    let result;

    switch (operation) {
      case 'getCustomerByEmail': {
        if (!payload.email) {
          throw new Error('Email is required');
        }
        result = await getCustomerByEmail(payload.email);
        break;
      }
      case 'updateCustomerProfile': {
        const { customerId, profile } = payload;
        if (!customerId || !profile) {
          throw new Error('customerId and profile are required');
        }
        result = await updateCustomerProfile(customerId, profile);
        break;
      }
      case 'createCustomerAddress': {
        const { customerId, address } = payload;
        if (!customerId || !address) {
          throw new Error('customerId and address are required');
        }
        result = await createCustomerAddress(customerId, address);
        break;
      }
      case 'updateCustomerAddress': {
        const { customerId, addressId, address } = payload;
        if (!customerId || !addressId || !address) {
          throw new Error('customerId, addressId and address are required');
        }
        result = await updateCustomerAddress(customerId, addressId, address);
        break;
      }
      case 'deleteCustomerAddress': {
        const { customerId, addressId } = payload;
        if (!customerId || !addressId) {
          throw new Error('customerId and addressId are required');
        }
        result = await deleteCustomerAddress(customerId, addressId);
        break;
      }
      case 'setDefaultAddress': {
        const { customerId, addressId } = payload;
        if (!customerId || !addressId) {
          throw new Error('customerId and addressId are required');
        }
        result = await setDefaultAddress(customerId, addressId);
        break;
      }
      case 'saveCustomerCart': {
        const { customerId, cartState } = payload;
        if (!customerId) {
          throw new Error('customerId is required');
        }
        result = await saveCustomerCartState(customerId, cartState);
        break;
      }
      case 'clearCustomerCart': {
        const { customerId } = payload;
        if (!customerId) {
          throw new Error('customerId is required');
        }
        result = await clearCustomerCartState(customerId);
        break;
      }
      case 'redeemCustomerPoints': {
        const { customerId, points } = payload;
        if (!customerId) {
          throw new Error('customerId is required');
        }
        result = await redeemCustomerPoints(customerId, points);
        break;
      }
      case 'getOrderDetails': {
        if (!payload.orderId) {
          throw new Error('orderId is required');
        }
        result = await getOrderDetails(payload.orderId);
        break;
      }
      default:
        return {
          statusCode: 400,
          headers: HEADERS,
          body: JSON.stringify({ error: `Unsupported operation: ${operation}` }),
        };
    }

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ data: result }),
    };
  } catch (error) {
    console.error('shopify-admin error', error);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};
