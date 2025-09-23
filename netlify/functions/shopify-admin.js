const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const SHOP_DOMAIN = process.env.SHOPIFY_DOMAIN || process.env.VITE_SHOPIFY_DOMAIN;
const ADMIN_TOKEN = process.env.ADMIN_API_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
const API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION || process.env.VITE_SHOPIFY_API_VERSION || '2025-04';

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
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
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
  return data.customers?.edges?.[0]?.node || null;
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
  return result?.customer || null;
}

async function createCustomerAddress(customerId, address) {
  const numericCustomerId = toNumericId(customerId);
  const payload = {
    address,
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
    address,
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

async function deleteCustomerAddress(customerId, addressId) {
  const numericCustomerId = toNumericId(customerId);
  const numericAddressId = toNumericId(addressId);

  await adminRestFetch(`customers/${numericCustomerId}/addresses/${numericAddressId}.json`, {
    method: 'DELETE',
  });

  return ensureGlobalId(numericAddressId);
}

async function setDefaultAddress(customerId, addressId) {
  const numericCustomerId = toNumericId(customerId);
  const numericAddressId = toNumericId(addressId);

  const data = await adminRestFetch(`customers/${numericCustomerId}/addresses/${numericAddressId}/default.json`, {
    method: 'PUT',
  });

  return normalizeAddressForClient(data?.customer_address);
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

function normalizeCustomer(customer) {
  if (!customer) return null;
  const addresses = Array.isArray(customer.addresses)
    ? customer.addresses
    : customer.addresses?.edges?.map(edge => edge.node) || [];
  return {
    ...customer,
    addresses,
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
        result = normalizeCustomer(await getCustomerByEmail(payload.email));
        break;
      }
      case 'updateCustomerProfile': {
        const { customerId, profile } = payload;
        if (!customerId || !profile) {
          throw new Error('customerId and profile are required');
        }
        result = normalizeCustomer(await updateCustomerProfile(customerId, profile));
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
