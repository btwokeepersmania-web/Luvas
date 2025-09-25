/**
 * Shopify Customer Account API Authentication Service
 * Implements OAuth 2.0 flow for headless authentication
 */

const CLIENT_ID = import.meta.env.VITE_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID;
const RAW_CUSTOMER_DOMAIN = import.meta.env.VITE_SHOPIFY_CUSTOMER_ACCOUNT_DOMAIN || import.meta.env.VITE_SHOPIFY_DOMAIN;
const SHOP_DOMAIN = RAW_CUSTOMER_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '');
const REDIRECT_URI = `${window.location.origin}/auth/callback`;

const ACCOUNT_BASE = SHOP_DOMAIN?.includes('/account')
  ? `https://${SHOP_DOMAIN}`
  : `https://${SHOP_DOMAIN}/account`;

// Customer Account API endpoints
const ENDPOINTS = {
  authorize: `https://${SHOP_DOMAIN}/auth/oauth/authorize`,
  token: `https://${SHOP_DOMAIN}/auth/oauth/token`,
  logout: `${ACCOUNT_BASE}/logout`,
  customerAccount: `${ACCOUNT_BASE}/customer/api/2024-07/graphql`,
};

/**
 * Generate a secure random string for state parameter
 */
function generateState() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate PKCE challenge and verifier
 */
async function generatePKCE() {
  const codeVerifier = generateState();
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return { codeVerifier, codeChallenge };
}

/**
 * Store authentication data in sessionStorage
 */
function storeAuthData(data) {
  sessionStorage.setItem('shopify_auth_data', JSON.stringify(data));
}

/**
 * Retrieve authentication data from sessionStorage
 */
function getAuthData() {
  const data = sessionStorage.getItem('shopify_auth_data');
  return data ? JSON.parse(data) : null;
}

/**
 * Clear authentication data
 */
function clearAuthData() {
  sessionStorage.removeItem('shopify_auth_data');
  localStorage.removeItem('shopify_access_token');
  localStorage.removeItem('shopify_refresh_token');
}

/**
 * Initiate OAuth 2.0 authentication flow
 */
export async function initiateLogin({ mode = 'login' } = {}) {
  if (!CLIENT_ID || !SHOP_DOMAIN) {
    throw new Error('Shopify Customer Account API not configured. Please add VITE_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID to your environment variables.');
  }

  const { codeVerifier, codeChallenge } = await generatePKCE();
  const state = generateState();

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: 'openid email',
    redirect_uri: REDIRECT_URI,
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    ...(mode === 'register' ? { action: 'register' } : {}),
  });

  const authUrl = `${ENDPOINTS.authorize}?${params.toString()}`;

  const popupFeatures = 'width=520,height=640,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes';
  const popup = window.open(authUrl, 'shopify-customer-login', popupFeatures);
  const resultMode = popup ? 'popup' : 'redirect';

  // Store PKCE verifier and state for later verification
  storeAuthData({ codeVerifier, state, mode: resultMode });

  if (popup) {
    try {
      popup.focus();
    } catch (err) {
      console.warn('Unable to focus Shopify auth popup:', err);
    }
    return { mode: 'popup' };
  }

  window.location.href = authUrl;
  return { mode: 'redirect' };
}

/**
 * Handle OAuth callback and exchange code for tokens
 */
export async function handleCallback(code, state) {
  const authData = getAuthData();

  if (!authData || authData.state !== state) {
    throw new Error('Invalid state parameter. Possible CSRF attack.');
  }

  // Call server-side Netlify function to exchange code + PKCE verifier for tokens
  const res = await fetch('/.netlify/functions/auth-callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, code_verifier: authData.codeVerifier, redirect_uri: REDIRECT_URI }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${txt}`);
  }

  const tokens = await res.json();

  // If server set httpOnly cookies, prefer server cookie; keep localStorage for backward compatibility
  try {
    if (tokens.access_token) {
      localStorage.setItem('shopify_access_token', tokens.access_token);
    }
    if (tokens.refresh_token) {
      localStorage.setItem('shopify_refresh_token', tokens.refresh_token);
    }
  } catch (e) {
    // ignore storage errors
  }

  // Clear temporary auth data
  clearAuthData();

  return tokens;
}

/**
 * Get current access token
 */
export function getAccessToken() {
  return localStorage.getItem('shopify_access_token');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!getAccessToken();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken() {
  // Prefer server-side refresh which uses httpOnly cookie
  const res = await fetch('/.netlify/functions/refresh-token', { method: 'POST' });

  if (!res.ok) {
    // Clear local tokens and require re-authentication
    clearAuthData();
    throw new Error('Token refresh failed');
  }

  const json = await res.json();
  // Update localStorage for compatibility if tokens returned
  if (json.tokens) {
    try {
      if (json.tokens.access_token) localStorage.setItem('shopify_access_token', json.tokens.access_token);
      if (json.tokens.refresh_token) localStorage.setItem('shopify_refresh_token', json.tokens.refresh_token);
    } catch (e) {}
  }

  return json.tokens || null;
}

/**
 * Make authenticated requests to Customer Account API
 */
export async function customerAccountFetch(query, variables = {}) {
  let accessToken = getAccessToken();
  
  if (!accessToken) {
    throw new Error('No access token available');
  }
  
  let response = await fetch(ENDPOINTS.customerAccount, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  
  // If token expired, try to refresh
  if (response.status === 401) {
    try {
      await refreshToken();
      accessToken = getAccessToken();
      
      response = await fetch(ENDPOINTS.customerAccount, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ query, variables }),
      });
    } catch (error) {
      // Refresh failed, redirect to login
      throw new Error('Authentication expired. Please log in again.');
    }
  }
  
  if (!response.ok) {
    throw new Error(`Customer Account API request failed: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Logout user and clear all authentication data
 */
export async function logout() {
  const accessToken = getAccessToken();
  
  if (accessToken) {
    try {
      // Attempt to revoke token on server
      const logoutUrl = `${ENDPOINTS.logout}?id_token_hint=${accessToken}&post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`;
      window.location.href = logoutUrl;
    } catch (error) {
      console.error('Logout request failed:', error);
    }
  }
  
  // Clear local authentication data
  clearAuthData();
}

/**
 * Check if Customer Account API is properly configured
 */
export function isConfigured() {
  return !!(CLIENT_ID && SHOP_DOMAIN);
}
