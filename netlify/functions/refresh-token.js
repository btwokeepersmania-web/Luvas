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
    const cookieHeader = event.headers?.cookie || event.headers?.Cookie || '';
    const cookies = Object.fromEntries(cookieHeader.split(';').map(c => c.split('=').map(s => s && s.trim())).filter(Boolean).map(([k, v]) => [k, decodeURIComponent(v)]));
    const refreshToken = cookies['shopify_refresh_token'];

    if (!refreshToken) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'No refresh token available' }) };
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
    params.append('grant_type', 'refresh_token');
    params.append('client_id', CLIENT_ID);
    params.append('refresh_token', refreshToken);

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const jsonText = await tokenRes.text();
    let json;
    try { json = JSON.parse(jsonText); } catch(e) { return { statusCode: tokenRes.status, headers, body: JSON.stringify({ error: 'Token endpoint error', details: jsonText }) }; }

    if (!tokenRes.ok) {
      return { statusCode: tokenRes.status, headers, body: JSON.stringify({ error: 'Token refresh failed', details: json }) };
    }

    const setCookieHeaders = [];
    if (json.access_token) {
      const maxAge = json.expires_in ? parseInt(json.expires_in, 10) : 3600;
      const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
      setCookieHeaders.push(`shopify_access_token=${encodeURIComponent(json.access_token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}; Expires=${expires}`);
    }
    if (json.refresh_token) {
      const refreshMaxAge = 60 * 60 * 24 * 30;
      const refreshExpires = new Date(Date.now() + refreshMaxAge * 1000).toUTCString();
      setCookieHeaders.push(`shopify_refresh_token=${encodeURIComponent(json.refresh_token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${refreshMaxAge}; Expires=${refreshExpires}`);
    }

    const responseHeaders = { ...headers };
    if (setCookieHeaders.length) responseHeaders['Set-Cookie'] = setCookieHeaders;

    return { statusCode: 200, headers: responseHeaders, body: JSON.stringify({ success: true, tokens: json }) };
  } catch (err) {
    console.error('refresh-token error', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
