const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const SHOP_DOMAIN = process.env.SHOPIFY_DOMAIN || process.env.VITE_SHOPIFY_DOMAIN;
const ADMIN_TOKEN = process.env.ADMIN_API_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
const API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION || process.env.VITE_SHOPIFY_API_VERSION || '2025-04';

const isConfigured = Boolean(SHOP_DOMAIN && ADMIN_TOKEN);

async function adminFetch(query, variables = {}) {
  if (!isConfigured) {
    throw new Error('Shopify Admin API not configured');
  }

  const response = await fetch(`https://${SHOP_DOMAIN}/admin/api/${API_VERSION}/graphql.json`, {
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
    zip
    country
    phone
  }
  addresses(first: 10) {
    edges {
      node {
        id
        firstName
        lastName
        company
        address1
        address2
        city
        province
        zip
        country
        phone
      }
    }
  }
  orders(first: 50, sortKey: CREATED_AT, reverse: true) {
    edges {
      node {
        id
        name
        orderNumber
        createdAt
        updatedAt
        processedAt
        financialStatus
        fulfillmentStatus
        currencyCode
        totalPrice
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
          zip
          country
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
          zip
          country
          phone
        }
        trackingNumbers
        trackingUrls
        lineItems(first: 50) {
          edges {
            node {
              title
              quantity
              originalUnitPrice
              discountedTotal
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
        fulfillments {
          id
          status
          trackingNumbers
          trackingUrls
          trackingCompany
          updatedAt
          estimatedDeliveryAt
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
  const mutation = `
    mutation customerAddressCreate($customerId: ID!, $address: MailingAddressInput!) {
      customerAddressCreate(customerId: $customerId, address: $address) {
        customerAddress {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await adminFetch(mutation, { customerId, address });
  const result = data.customerAddressCreate;
  if (result?.userErrors?.length) {
    throw new Error(result.userErrors.map(e => e.message).join(', '));
  }
  return result?.customerAddress || null;
}

async function updateCustomerAddress(customerId, addressId, address) {
  const mutation = `
    mutation customerAddressUpdate($customerId: ID!, $id: ID!, $address: MailingAddressInput!) {
      customerAddressUpdate(customerId: $customerId, id: $id, address: $address) {
        customerAddress {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await adminFetch(mutation, { customerId, id: addressId, address });
  const result = data.customerAddressUpdate;
  if (result?.userErrors?.length) {
    throw new Error(result.userErrors.map(e => e.message).join(', '));
  }
  return result?.customerAddress || null;
}

async function deleteCustomerAddress(customerId, addressId) {
  const mutation = `
    mutation customerAddressDelete($customerId: ID!, $id: ID!) {
      customerAddressDelete(customerId: $customerId, id: $id) {
        deletedCustomerAddressId
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await adminFetch(mutation, { customerId, id: addressId });
  const result = data.customerAddressDelete;
  if (result?.userErrors?.length) {
    throw new Error(result.userErrors.map(e => e.message).join(', '));
  }
  return result?.deletedCustomerAddressId || null;
}

async function setDefaultAddress(customerId, addressId) {
  const mutation = `
    mutation customerDefaultAddressUpdate($customerId: ID!, $addressId: ID!) {
      customerDefaultAddressUpdate(customerId: $customerId, addressId: $addressId) {
        customer {
          defaultAddress {
            id
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await adminFetch(mutation, { customerId, addressId });
  const result = data.customerDefaultAddressUpdate;
  if (result?.userErrors?.length) {
    throw new Error(result.userErrors.map(e => e.message).join(', '));
  }
  return result?.customer?.defaultAddress || null;
}

async function getOrderDetails(orderId) {
  const query = `
    query getOrder($id: ID!) {
      order(id: $id) {
        id
        name
        orderNumber
        createdAt
        updatedAt
        processedAt
        financialStatus
        fulfillmentStatus
        currencyCode
        totalPrice
        subtotalPrice
        totalShippingPrice
        totalTax
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
          zip
          country
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
          zip
          country
          phone
        }
        lineItems(first: 50) {
          edges {
            node {
              title
              quantity
              originalUnitPrice
              discountedTotal
              variant {
                id
                title
                sku
                image { url altText }
              }
            }
          }
        }
        fulfillments {
          id
          status
          trackingNumbers
          trackingUrls
          trackingCompany
          updatedAt
          estimatedDeliveryAt
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
  const addresses = customer.addresses?.edges?.map(edge => edge.node) || [];
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
