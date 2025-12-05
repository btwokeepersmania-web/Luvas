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
    const expired = 'Thu, 01 Jan 1970 00:00:00 GMT';
    const cookies = [
      `shopify_access_token=; HttpOnly; Secure; SameSite=Lax; Path=/; Expires=${expired}`,
      `shopify_refresh_token=; HttpOnly; Secure; SameSite=Lax; Path=/; Expires=${expired}`,
    ];

    const responseHeaders = { ...headers, 'Set-Cookie': cookies };
    return { statusCode: 200, headers: responseHeaders, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('logout error', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
