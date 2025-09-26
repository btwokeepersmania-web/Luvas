/**
 * Shopify Admin API Service for Customer Management
 * Uses GraphQL Admin API with ADMIN_API_ACCESS_TOKEN
 */

const ADMIN_FUNCTION_ENDPOINT = '/.netlify/functions/shopify-admin';
const ADMIN_ENABLED = (import.meta.env.VITE_ENABLE_ADMIN_API === 'true') || (import.meta.env.PUBLIC_ENABLE_ADMIN_API === 'true');

async function callAdmin(operation, payload = {}) {
  if (!ADMIN_ENABLED) {
    throw new Error('Shopify Admin API is not enabled.');
  }

  const response = await fetch(ADMIN_FUNCTION_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ operation, payload }),
  });

  let json;
  try {
    json = await response.json();
  } catch (error) {
    throw new Error('Unexpected response from Shopify Admin endpoint');
  }

  if (!response.ok) {
    throw new Error(json?.error || 'Shopify Admin request failed');
  }

  return json?.data ?? null;
}

/**
 * Get customer details by email (for authentication sync)
 */
export async function getCustomerByEmail(email) {
  return callAdmin('getCustomerByEmail', { email });
}

/**
 * Update customer profile information
 */
export async function updateCustomerProfile(customerId, profileData) {
  return callAdmin('updateCustomerProfile', { customerId, profile: profileData });
}

/**
 * Create a new address for customer
 */
export async function createCustomerAddress(customerId, addressData) {
  return callAdmin('createCustomerAddress', { customerId, address: addressData });
}

/**
 * Update customer address
 */
export async function updateCustomerAddress(customerId, addressId, addressData) {
  return callAdmin('updateCustomerAddress', { customerId, addressId, address: addressData });
}

/**
 * Delete customer address
 */
export async function deleteCustomerAddress(customerId, addressId) {
  return callAdmin('deleteCustomerAddress', { customerId, addressId });
}

/**
 * Set default address for customer
 */
export async function setDefaultAddress(customerId, addressId) {
  return callAdmin('setDefaultAddress', { customerId, addressId });
}

/**
 * Persist cart state for a customer (used to share carts across devices)
 */
export async function saveCustomerCart(customerId, cartState) {
  return callAdmin('saveCustomerCart', { customerId, cartState });
}

/**
 * Clear persisted cart state for a customer
 */
export async function clearCustomerCart(customerId) {
  return callAdmin('clearCustomerCart', { customerId });
}

/**
 * Get real-time order details with tracking
 */
export async function getOrderDetails(orderId) {
  return callAdmin('getOrderDetails', { orderId });
}

/**
 * Redeem loyalty points into a discount code
 */
export async function redeemCustomerPoints(customerId, points, options = {}) {
  const payload = { customerId, points, ...options };
  return callAdmin('redeemCustomerPoints', payload);
}

/**
 * Check if Admin API is configured
 */
export function isAdminApiConfigured() {
  return ADMIN_ENABLED;
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
