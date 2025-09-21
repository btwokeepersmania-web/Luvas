/**
 * Shopify Admin API Service for Customer Management
 * Uses GraphQL Admin API with ADMIN_API_ACCESS_TOKEN
 */

const SHOP_DOMAIN = import.meta.env.VITE_SHOPIFY_DOMAIN;
const ADMIN_ACCESS_TOKEN = import.meta.env.ADMIN_API_ACCESS_TOKEN;
const API_VERSION = import.meta.env.VITE_SHOPIFY_API_VERSION || '2025-04';

if (!ADMIN_ACCESS_TOKEN) {
  console.warn('ADMIN_API_ACCESS_TOKEN not configured - Admin API features will be disabled');
}

/**
 * Make authenticated requests to Shopify Admin API
 */
async function adminFetch(query, variables = {}) {
  if (!ADMIN_ACCESS_TOKEN || !SHOP_DOMAIN) {
    throw new Error('Shopify Admin API not configured');
  }

  const response = await fetch(`https://${SHOP_DOMAIN}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ADMIN_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Admin API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`GraphQL errors: ${data.errors.map(e => e.message).join(', ')}`);
  }

  return data;
}

/**
 * Get customer details by email (for authentication sync)
 */
export async function getCustomerByEmail(email) {
  const query = `
    query getCustomerByEmail($email: String!) {
      customers(first: 1, query: $email) {
        edges {
          node {
            id
            firstName
            lastName
            displayName
            email
            phone
            createdAt
            updatedAt
            addresses {
              id
              address1
              address2
              city
              company
              country
              firstName
              lastName
              phone
              province
              zip
            }
            defaultAddress {
              id
              address1
              address2
              city
              company
              country
              firstName
              lastName
              phone
              province
              zip
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
                  totalPrice
                  currencyCode
                  shippingAddress {
                    address1
                    address2
                    city
                    company
                    country
                    firstName
                    lastName
                    phone
                    province
                    zip
                  }
                  trackingNumbers
                  trackingUrls
                  lineItems(first: 10) {
                    edges {
                      node {
                        title
                        quantity
                        variant {
                          id
                          title
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
          }
        }
      }
    }
  `;

  const data = await adminFetch(query, { email: `email:${email}` });
  return data.data?.customers?.edges?.[0]?.node || null;
}

/**
 * Update customer profile information
 */
export async function updateCustomerProfile(customerId, profileData) {
  const mutation = `
    mutation updateCustomer($input: CustomerInput!) {
      customerUpdate(input: $input) {
        customer {
          id
          firstName
          lastName
          displayName
          email
          phone
          updatedAt
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const input = {
    id: customerId,
    ...profileData,
  };

  const data = await adminFetch(mutation, { input });
  
  if (data.data?.customerUpdate?.userErrors?.length > 0) {
    throw new Error(data.data.customerUpdate.userErrors.map(e => e.message).join(', '));
  }

  return data.data?.customerUpdate?.customer;
}

/**
 * Create a new address for customer
 */
export async function createCustomerAddress(customerId, addressData) {
  const mutation = `
    mutation customerAddressCreate($customerId: ID!, $address: MailingAddressInput!) {
      customerAddressCreate(customerId: $customerId, address: $address) {
        customerAddress {
          id
          address1
          address2
          city
          company
          country
          firstName
          lastName
          phone
          province
          zip
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
    address: addressData 
  });
  
  if (data.data?.customerAddressCreate?.userErrors?.length > 0) {
    throw new Error(data.data.customerAddressCreate.userErrors.map(e => e.message).join(', '));
  }

  return data.data?.customerAddressCreate?.customerAddress;
}

/**
 * Update customer address
 */
export async function updateCustomerAddress(customerId, addressId, addressData) {
  // Since customerAddressUpdate may not be available in 2025-01, 
  // we'll use customerUpdate to replace the entire address list
  const customer = await getCustomerByEmail(customerId);
  if (!customer) throw new Error('Customer not found');

  const updatedAddresses = customer.addresses.map(addr => 
    addr.id === addressId ? { ...addr, ...addressData } : addr
  );

  const mutation = `
    mutation customerUpdate($input: CustomerInput!) {
      customerUpdate(input: $input) {
        customer {
          id
          addresses {
            id
            address1
            address2
            city
            company
            country
            firstName
            lastName
            phone
            province
            zip
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const input = {
    id: customer.id,
    addresses: updatedAddresses,
  };

  const data = await adminFetch(mutation, { input });
  
  if (data.data?.customerUpdate?.userErrors?.length > 0) {
    throw new Error(data.data.customerUpdate.userErrors.map(e => e.message).join(', '));
  }

  return data.data?.customerUpdate?.customer?.addresses?.find(addr => addr.id === addressId);
}

/**
 * Delete customer address
 */
export async function deleteCustomerAddress(customerId, addressId) {
  const customer = await getCustomerByEmail(customerId);
  if (!customer) throw new Error('Customer not found');

  const filteredAddresses = customer.addresses.filter(addr => addr.id !== addressId);

  const mutation = `
    mutation customerUpdate($input: CustomerInput!) {
      customerUpdate(input: $input) {
        customer {
          id
          addresses {
            id
            address1
            address2
            city
            company
            country
            firstName
            lastName
            phone
            province
            zip
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const input = {
    id: customer.id,
    addresses: filteredAddresses,
  };

  const data = await adminFetch(mutation, { input });
  
  if (data.data?.customerUpdate?.userErrors?.length > 0) {
    throw new Error(data.data.customerUpdate.userErrors.map(e => e.message).join(', '));
  }

  return data.data?.customerUpdate?.customer;
}

/**
 * Set default address for customer
 */
export async function setDefaultAddress(customerId, addressId) {
  const mutation = `
    mutation customerUpdateDefaultAddress($customerId: ID!, $addressId: ID!) {
      customerUpdateDefaultAddress(customerId: $customerId, addressId: $addressId) {
        customer {
          id
          defaultAddress {
            id
            address1
            address2
            city
            company
            country
            firstName
            lastName
            phone
            province
            zip
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
  
  if (data.data?.customerUpdateDefaultAddress?.userErrors?.length > 0) {
    throw new Error(data.data.customerUpdateDefaultAddress.userErrors.map(e => e.message).join(', '));
  }

  return data.data?.customerUpdateDefaultAddress?.customer;
}

/**
 * Get real-time order details with tracking
 */
export async function getOrderDetails(orderId) {
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
        totalPrice
        currencyCode
        note
        shippingAddress {
          address1
          address2
          city
          company
          country
          firstName
          lastName
          phone
          province
          zip
        }
        lineItems(first: 50) {
          edges {
            node {
              title
              quantity
              variant {
                id
                title
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
          service {
            handle
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
        tags
      }
    }
  `;

  const data = await adminFetch(query, { id: orderId });
  return data.data?.order;
}

/**
 * Check if Admin API is configured
 */
export function isAdminApiConfigured() {
  return !!(ADMIN_ACCESS_TOKEN && SHOP_DOMAIN);
}

/**
 * Validate address data
 */
export function validateAddress(address) {
  const required = ['address1', 'city', 'country'];
  const missing = required.filter(field => !address[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  return true;
}
