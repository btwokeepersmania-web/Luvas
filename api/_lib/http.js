import { Buffer } from 'node:buffer';

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export async function toNetlifyEvent(req) {
  const body = await readBody(req);
  return {
    httpMethod: req.method || 'GET',
    headers: req.headers || {},
    body,
    isBase64Encoded: false,
  };
}

export function sendNetlifyResponse(res, result = {}) {
  const statusCode = result.statusCode || 200;
  const headers = result.headers || {};
  const body = result.body ?? '';

  Object.entries(headers).forEach(([key, value]) => {
    if (value !== undefined) {
      res.setHeader(key, value);
    }
  });

  res.status(statusCode).send(body);
}
