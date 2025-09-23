import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { handleCallback } from '@/lib/shopify/customerAuth.js';
import { useAuth } from '@/context/AuthContext.jsx';
import { useTranslation } from 'react-i18next';

const AuthCallbackPage = () => {
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchCustomerData } = useAuth();
  const { t } = useTranslation();
  const [isPopup] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return Boolean(window.opener && !window.opener.closed && window.opener.location.origin === window.location.origin);
    } catch (err) {
      return false;
    }
  });

  const notifyParent = useCallback((payload) => {
    if (!isPopup) return;
    try {
      window.opener.postMessage({ source: 'shopify-auth', ...payload }, window.location.origin);
    } catch (err) {
      console.error('Failed to notify opener window:', err);
    }
  }, [isPopup]);
  
  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`Authentication failed: ${error}`);
        }

        if (!code || !state) {
          throw new Error('Missing required authentication parameters');
        }

        // Exchange authorization code for tokens
        const tokens = await handleCallback(code, state);

        // Fetch customer data with the new access token
        let customerData = null;
        if (tokens.access_token) {
          customerData = await fetchCustomerData(tokens.access_token);
        }

        // If we have customer email, trigger 2FA OTP send and wait for verification
        const email = customerData?.email || customerData?.emailAddress || null;
        if (email) {
          try {
            const res = await fetch('/.netlify/functions/auth-verification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'send-code', email }),
            });
            const json = await res.json();
            if (json.success) {
              setStatus('awaiting-code');
              // temporarily store email in state for verification step
              sessionStorage.setItem('auth_2fa_email', email);
              return;
            }
          } catch (err) {
            console.error('Failed to request 2FA code:', err);
            // fallback: continue without 2FA
          }
        }

        // No email or 2FA not required: complete login
        setStatus('success');
        const returnTo = sessionStorage.getItem('auth_return_to') || '/account';
        sessionStorage.removeItem('auth_return_to');

        if (isPopup) {
          notifyParent({ status: 'success', returnTo });
          window.close();
          return;
        }

        setTimeout(() => {
          navigate(returnTo, { replace: true });
        }, 1200);

      } catch (err) {
        console.error('Authentication callback error:', err);
        setError(err.message);
        setStatus('error');

        if (isPopup) {
          notifyParent({ status: 'error', error: err.message });
          setTimeout(() => window.close(), 400);
          return;
        }

        // Redirect to login page after error display
        setTimeout(() => {
          navigate('/account/login', { replace: true });
        }, 3000);
      }
    };

    processCallback();
  }, [searchParams, navigate, fetchCustomerData]);

  // 2FA verification handlers
  const [codeInput, setCodeInput] = React.useState('');
  const [verifying, setVerifying] = React.useState(false);
  const [verifyError, setVerifyError] = React.useState(null);

  const handleVerifyCode = async () => {
    setVerifying(true);
    setVerifyError(null);
    const email = sessionStorage.getItem('auth_2fa_email');
    try {
      const res = await fetch('/.netlify/functions/auth-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-code', email, code: codeInput }),
      });
      const json = await res.json();
        if (json.success) {
          // mark 2FA done and fetch customer data again just in case
          sessionStorage.removeItem('auth_2fa_email');
          if (json.customer) {
            try { await fetchCustomerData(); } catch(e) { /* ignore */ }
          }
          setStatus('success');
          const returnTo = sessionStorage.getItem('auth_return_to') || '/account';
          sessionStorage.removeItem('auth_return_to');

          if (isPopup) {
            notifyParent({ status: 'success', returnTo });
            setTimeout(() => window.close(), 400);
            return;
          }

          setTimeout(() => navigate(returnTo, { replace: true }), 800);
      } else {
        setVerifyError(json.error || 'Invalid code');
      }
    } catch (err) {
      console.error('Verification request failed:', err);
      setVerifyError('Network error');
    } finally {
      setVerifying(false);
    }
  };
  
  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              {t('auth.callback.processing')}
            </h1>
            <p className="text-gray-400">
              {t('auth.callback.processingDescription')}
            </p>
          </>
        );

      case 'awaiting-code':
        return (
          <>
            <h1 className="text-2xl font-bold text-white mb-2">{t('auth.2fa.title') || 'Confirme seu código'}</h1>
            <p className="text-gray-400 mb-4">{t('auth.2fa.instructions') || 'Um código foi enviado para o seu e-mail. Insira abaixo para completar o login.'}</p>
            <div className="mt-4">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-40 mx-auto block text-center text-2xl tracking-widest bg-gray-800 border border-gray-700 rounded-md p-3"
                placeholder="123456"
              />
              <div className="mt-4 flex justify-center items-center space-x-3">
                <button
                  onClick={handleVerifyCode}
                  className="bg-green-500 hover:bg-green-600 text-black font-bold px-6 py-2 rounded-lg"
                  disabled={verifying || codeInput.length < 6}
                >
                  {verifying ? 'Verificando...' : t('auth.2fa.verifyButton') || 'Verificar'}
                </button>
              </div>
              {verifyError && <p className="text-red-400 text-sm mt-3">{verifyError}</p>}
            </div>
          </>
        );

      case 'success':
        return (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              {t('auth.callback.success')}
            </h1>
            <p className="text-gray-400">
              {t('auth.callback.successDescription')}
            </p>
          </>
        );

      case 'error':
        return (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              {t('auth.callback.error')}
            </h1>
            <p className="text-gray-400 mb-4">
              {error || t('auth.callback.errorDescription')}
            </p>
            <p className="text-sm text-gray-500">
              {t('auth.callback.redirecting')}
            </p>
          </>
        );

      default:
        return null;
    }
  };
  
  return (
    <>
      <Helmet>
        <title>{t('auth.callback.title')} - B2 Goalkeeping</title>
      </Helmet>
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full text-center p-8 bg-gray-900/50 border border-green-500/20 rounded-2xl shadow-2xl shadow-green-500/10"
        >
          {renderContent()}
        </motion.div>
      </div>
    </>
  );
};

export default AuthCallbackPage;
