const nodemailer = require('nodemailer');

// In-memory store for verification codes (in production, use Redis or database)
const verificationCodes = new Map();

// Optional Supabase persistence
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
let supabase = null;
let useSupabase = false;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    useSupabase = true;
  } catch (e) {
    console.warn('Supabase client not available, falling back to in-memory storage:', e.message || e);
    useSupabase = false;
  }
}

// EmailJS configuration
const EMAILJS_SERVICE_ID = process.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_OTP_TEMPLATE_ID = process.env.VITE_EMAILJS_OTP_TEMPLATE_ID || EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = process.env.VITE_EMAILJS_PUBLIC_KEY;

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // or your preferred email service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Generate random 6-digit code
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Verify customer exists in Shopify (resilient)
const verifyCustomerExists = async (email) => {
  try {
    const shopDomain = process.env.VITE_SHOPIFY_DOMAIN;
    const accessToken = process.env.ADMIN_API_ACCESS_TOKEN;
    const apiVersion = process.env.VITE_SHOPIFY_API_VERSION || '2025-04';

    if (!shopDomain || !accessToken) {
      console.warn('Shopify configuration missing');
      return null;
    }

    const query = `
      query getCustomerByEmail($email: String!) {
        customers(first: 1, query: $email) {
          edges {
            node {
              id
              firstName
              lastName
              email
              phone
            }
          }
        }
      }
    `;

    const url = `https://${shopDomain}/admin/api/${apiVersion}/graphql.json`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query, variables: { email: `email:${email}` } }),
    });

    if (!response.ok) {
      const txt = await response.text().catch(() => '');
      console.warn('Shopify customer fetch failed', response.status, txt);
      return null;
    }

    const data = await response.json().catch((e) => {
      console.warn('Failed to parse Shopify response JSON', e && e.message);
      return null;
    });

    if (!data) return null;
    if (data.errors) {
      console.warn('Shopify GraphQL errors', data.errors);
      return null;
    }

    return data.data?.customers?.edges?.[0]?.node || null;
  } catch (e) {
    console.error('verifyCustomerExists error', e && e.message ? e.message : e);
    return null;
  }
};

// Send verification email
const sendVerificationEmail = async (email, code, customerName) => {
  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981, #fbbf24); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; text-align: center;">B2 Goalkeeping</h1>
        </div>

        <h2 style="color: #333;">Hello ${customerName || 'there'}!</h2>

        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          Your verification code for logging into B2 Goalkeeping is:
        </p>

        <div style="background: #f8f9fa; border: 2px solid #10b981; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #10b981; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
        </div>

        <p style="color: #666; font-size: 14px;">
          This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
        </p>

        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
          <p style="color: #999; font-size: 12px;">
            © 2024 B2 Goalkeeping. All rights reserved.
          </p>
        </div>
      </div>
    `;

  // Prefer SendGrid if API key is provided
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const FROM_EMAIL = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  if (SENDGRID_API_KEY && FROM_EMAIL) {
    // Use SendGrid HTTP API
    const payload = {
      personalizations: [{ to: [{ email }], subject: 'B2 Goalkeeping - Verification Code' }],
      from: { email: FROM_EMAIL, name: 'B2 Goalkeeping' },
      content: [{ type: 'text/html', value: html }]
    };

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`SendGrid send failed: ${res.status} ${errText}`);
    }

    return;
  }

  // Try EmailJS if configured
  const emailJsTemplate = EMAILJS_OTP_TEMPLATE_ID || EMAILJS_TEMPLATE_ID;

  if (EMAILJS_SERVICE_ID && emailJsTemplate && EMAILJS_PUBLIC_KEY) {
    const subject = 'Verification Code';
    const message = `Your verification code is ${code}. It expires in 10 minutes. If you did not request this, please ignore this email.`;
    const payload = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: emailJsTemplate,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: email,
        to_name: customerName || 'Customer',
        user_email: email,
        user_name: customerName || 'Customer',
        subject,
        message,
        verification_code: code,
        code,
        customer_name: customerName || '',
      },
    };

    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`EmailJS send failed: ${res.status} ${errText}`);
    }

    return;
  }

  // Fallback to SMTP nodemailer
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'B2 Goalkeeping - Verification Code',
    html
  };

  await transporter.sendMail(mailOptions);
};

exports.handler = async (event, context) => {
  // Enable CORS and always return JSON
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Log minimal request info for debugging (avoid logging secrets)
    console.log('auth-verification invoked', { path: event.path, headers: { 'user-agent': event.headers && event.headers['user-agent'] } });

    // Robust body parsing: ensure we only parse event.body
    let payload = {};
    if (!event.body || typeof event.body !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Invalid or missing request body' })
      };
    }

    try {
      payload = JSON.parse(event.body);
    } catch (e) {
      console.warn('Failed to parse request body as JSON', e && e.message ? e.message : e);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Invalid JSON body' })
      };
    }

    const { action, email, code } = payload || {};

    // basic validation
    if (!action) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Missing action' }) };
    }

    if (action === 'send-code' && !email) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Missing email for send-code' }) };
    }

    if (action === 'verify-code' && (!email || !code)) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Missing email or code for verify-code' }) };
    }

    switch (action) {
      case 'send-code': {
        // Check if customer exists in Shopify
        const customer = await verifyCustomerExists(email);

        if (!customer) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ success: false, error: 'Customer not found. Please register first.' })
          };
        }

        // Rate limit: max 5 codes per hour per email (fallback to in-memory if Supabase unavailable)
        if (useSupabase) {
          try {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
            const { count, error } = await supabase
              .from('otp_codes')
              .select('id', { count: 'exact' })
              .gte('created_at', oneHourAgo)
              .eq('email', email);
            if (error) console.warn('Supabase count error', error.message || error);
            if (count && count >= 5) {
              return { statusCode: 429, headers, body: JSON.stringify({ success: false, error: 'Rate limit exceeded' }) };
            }
          } catch (e) {
            console.warn('Supabase rate check failed, falling back to in-memory', e.message || e);
          }
        } else {
          // in-memory: count sends in last hour
          const now = Date.now();
          const sends = Array.from(verificationCodes.values()).filter(v => v.customer?.email === email && (now - (v.createdAt || now)) < 60 * 60 * 1000).length;
          if (sends >= 5) {
            return { statusCode: 429, headers, body: JSON.stringify({ success: false, error: 'Rate limit exceeded' }) };
          }
        }

        // Generate and store verification code
        const verificationCode = generateCode();
        const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes

        if (useSupabase) {
          try {
            const insert = await supabase.from('otp_codes').insert([{ email, code: verificationCode, expires_at: new Date(expiresAt).toISOString(), attempts: 0 }]);
            if (insert.error) throw insert.error;
          } catch (e) {
            console.warn('Supabase insert failed, falling back to in-memory', e.message || e);
            verificationCodes.set(email, { code: verificationCode, expiresAt, customer, createdAt: Date.now(), attempts: 0 });
          }
        } else {
          verificationCodes.set(email, { code: verificationCode, expiresAt, customer, createdAt: Date.now(), attempts: 0 });
        }

        // Send email (only if an email service is configured)
        let emailSent = false;
        const hasEmailJs = EMAILJS_SERVICE_ID && (EMAILJS_OTP_TEMPLATE_ID || EMAILJS_TEMPLATE_ID) && EMAILJS_PUBLIC_KEY;
        const hasSendGrid = process.env.SENDGRID_API_KEY && (process.env.EMAIL_FROM || process.env.EMAIL_USER);
        const hasSmtp = process.env.EMAIL_USER && process.env.EMAIL_PASS;

        console.log('auth-verification provider flags', {
          hasEmailJs,
          hasSendGrid,
          hasSmtp,
          emailJsService: !!EMAILJS_SERVICE_ID,
          emailJsTemplate: !!(EMAILJS_OTP_TEMPLATE_ID || EMAILJS_TEMPLATE_ID),
          emailJsKey: !!EMAILJS_PUBLIC_KEY,
          hasFromEmail: !!process.env.EMAIL_FROM,
          hasEmailUser: !!process.env.EMAIL_USER,
        });

        if (hasEmailJs || hasSendGrid || hasSmtp) {
          try {
            await sendVerificationEmail(email, verificationCode, customer.firstName);
            emailSent = true;
          } catch (err) {
            console.error('Failed to send verification email:', err && err.message ? err.message : err);
            // do not throw — return success with emailSent=false
          }
        } else {
          console.warn('auth-verification: no email provider configured');
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Verification code generated',
            emailSent,
            providerConfigured: hasEmailJs || hasSendGrid || hasSmtp,
            ...(process.env.NODE_ENV === 'development' && { code: verificationCode })
          })
        };
      }

      case 'verify-code': {
        if (useSupabase) {
          try {
            const { data, error } = await supabase.from('otp_codes').select('*').eq('email', email).order('created_at', { ascending: false }).limit(1).single();
            if (error && error.code !== 'PGRST116') {
              throw error;
            }
            if (!data) {
              return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'No verification code found for this email' }) };
            }

            const stored = data;
            const now = new Date();
            if (new Date(stored.expires_at) < now) {
              return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Verification code has expired' }) };
            }

            // check attempts
            if ((stored.attempts || 0) >= 5) {
              return { statusCode: 429, headers, body: JSON.stringify({ success: false, error: 'Too many verification attempts' }) };
            }

            if (stored.code !== code) {
              // increment attempts
              await supabase.from('otp_codes').update({ attempts: (stored.attempts || 0) + 1 }).eq('id', stored.id);
              return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Invalid verification code' }) };
            }

            // delete or mark used
            await supabase.from('otp_codes').delete().eq('id', stored.id);

            // Fetch customer via Shopify query (if not stored)
            const customer = await verifyCustomerExists(email);

            // Generate a simple JWT-like token (in production, use proper JWT)
            const authToken = Buffer.from(JSON.stringify({ email: customer.email, id: customer.id, timestamp: Date.now() })).toString('base64');

            return { statusCode: 200, headers, body: JSON.stringify({ success: true, customer, authToken }) };

          } catch (e) {
            console.warn('Supabase verify failed, falling back to in-memory', e.message || e);
            // fallthrough to in-memory
          }
        }

        const stored = verificationCodes.get(email);

        if (!stored) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'No verification code found for this email'
            })
          };
        }

        if (Date.now() > stored.expiresAt) {
          verificationCodes.delete(email);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'Verification code has expired'
            })
          };
        }

        if (stored.code !== code) {
          stored.attempts = (stored.attempts || 0) + 1;
          verificationCodes.set(email, stored);
          if (stored.attempts >= 5) {
            verificationCodes.delete(email);
            return { statusCode: 429, headers, body: JSON.stringify({ success: false, error: 'Too many verification attempts' }) };
          }
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'Invalid verification code'
            })
          };
        }

        // Code is valid, clean up and return customer data
        verificationCodes.delete(email);

        // Generate a simple JWT-like token (in production, use proper JWT)
        const authToken = Buffer.from(JSON.stringify({
          email: stored.customer.email,
          id: stored.customer.id,
          timestamp: Date.now()
        })).toString('base64');

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            customer: stored.customer,
            authToken
          })
        };
      }

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }
  } catch (error) {
    console.error('Auth verification error:', error && error.message ? error.message : error);
    // include limited error info for debugging (avoid leaking sensitive data)
    const errResp = { success: false, error: 'Internal server error' };
    if (process.env.NODE_ENV === 'development') {
      errResp.debug = (error && error.stack) ? String(error.stack).slice(0, 1000) : String(error);
    }
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(errResp)
    };
  }
};
