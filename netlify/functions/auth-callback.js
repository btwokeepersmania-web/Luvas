exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { code, code_verifier, redirect_uri } = body;

    if (!code || !code_verifier) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing code or code_verifier' }) };
    }

    const RAW_ACCOUNT_DOMAIN = process.env.VITE_SHOPIFY_CUSTOMER_ACCOUNT_DOMAIN || process.env.VITE_SHOPIFY_DOMAIN || process.env.SHOPIFY_DOMAIN;
    const ACCOUNT_DOMAIN = RAW_ACCOUNT_DOMAIN
      ? RAW_ACCOUNT_DOMAIN.replace(/^https?:\/\//, '').replace(/\/$/, '')
      : null;
    const ACCOUNT_PATH = ACCOUNT_DOMAIN
      ? (ACCOUNT_DOMAIN.includes('/account') ? ACCOUNT_DOMAIN : `${ACCOUNT_DOMAIN}/account`)
      : null;
    const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID || process.env.VITE_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID;

    if (!ACCOUNT_PATH || !CLIENT_ID) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server not configured with customer account domain or client ID' }) };
    }

    const tokenUrl = `https://${ACCOUNT_PATH}/auth/oauth/token`;

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', CLIENT_ID);
    params.append('code', code);
    if (redirect_uri) params.append('redirect_uri', redirect_uri);
    params.append('code_verifier', code_verifier);

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const text = await tokenRes.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      // token endpoint returned non-JSON
      return { statusCode: tokenRes.status, headers, body: JSON.stringify({ error: 'Token endpoint error', details: text }) };
    }

    if (!tokenRes.ok) {
      return { statusCode: tokenRes.status, headers, body: JSON.stringify({ error: 'Token exchange failed', details: json }) };
    }

    // Set httpOnly cookies for access and refresh tokens
    const setCookieHeaders = [];
    const now = new Date();
    if (json.access_token) {
      const maxAge = json.expires_in ? parseInt(json.expires_in, 10) : 60 * 60; // default 1h
      const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
      setCookieHeaders.push(`shopify_access_token=${encodeURIComponent(json.access_token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}; Expires=${expires}`);
    }
    if (json.refresh_token) {
      // refresh tokens usually longer lived
      const refreshMaxAge = 60 * 60 * 24 * 30; // 30 days
      const refreshExpires = new Date(Date.now() + refreshMaxAge * 1000).toUTCString();
      setCookieHeaders.push(`shopify_refresh_token=${encodeURIComponent(json.refresh_token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${refreshMaxAge}; Expires=${refreshExpires}`);
    }

    const responseHeaders = { ...headers };
    if (setCookieHeaders.length) responseHeaders['Set-Cookie'] = setCookieHeaders;

    // Return tokens in body as well (maintain compatibility) but prefer cookie for security
    return { statusCode: 200, headers: responseHeaders, body: JSON.stringify(json) };
  } catch (err) {
    console.error('auth-callback error', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
