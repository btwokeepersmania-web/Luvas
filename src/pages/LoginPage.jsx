import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.jsx';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { LogIn, ExternalLink, Shield, Mail } from 'lucide-react';
import { useShopify } from '@/context/ShopifyContext.jsx';
import { initiateLogin, isConfigured as isCustomerAuthConfigured } from '@/lib/shopify/customerAuth.js';
import InAppLogin from '@/components/InAppLogin.jsx';
import AnimatedGradientText from '@/components/ui/animated-gradient-text.jsx';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { shopInfo } = useShopify();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const showShopifyLogin = false; // temporarily disable quick/shopify login

  const from = location.state?.from?.pathname || '/account';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  const returnUrl = encodeURIComponent(`${window.location.origin}/account`);
  const rawCustomerDomain = import.meta.env.VITE_SHOPIFY_CUSTOMER_ACCOUNT_DOMAIN || import.meta.env.VITE_SHOPIFY_DOMAIN;
  const customerDomain = rawCustomerDomain?.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const accountBase = customerDomain
    ? (customerDomain.includes('/account') ? `https://${customerDomain}` : `https://${customerDomain}/account`)
    : null;
  const shopifyLoginUrl = accountBase ? `${accountBase}/login?return_url=${returnUrl}` : '';
  const shopifyRegisterUrl = accountBase ? `${accountBase}/register?return_url=${returnUrl}` : '';

  const popupFeatures = 'width=520,height=640,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes';

  const openPopupOrRedirect = (url) => {
    const popup = window.open(url, 'shopify-auth', popupFeatures);
    if (!popup) {
      window.location.href = url;
      return;
    }
    try {
      popup.focus();
    } catch (err) {
      console.warn('Unable to focus Shopify window:', err);
    }
  };

  const handleSecureLogin = async () => {
    sessionStorage.setItem('auth_return_to', from || '/account');
    setLoading(true);
    // Fallback to hosted login while OAuth client is unavailable
    openPopupOrRedirect(shopifyLoginUrl);
  };

  const handleHostedLogin = () => {
    sessionStorage.setItem('auth_return_to', from || '/account');
    setLoading(true);
    openPopupOrRedirect(shopifyLoginUrl);
  };

  const handleHostedRegister = (event) => {
    if (event && event.preventDefault) event.preventDefault();
    sessionStorage.setItem('auth_return_to', from || '/account');
    setLoading(true);
    openPopupOrRedirect(shopifyRegisterUrl);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return () => {};

    const handler = (event) => {
      if (!event?.data || event.origin !== window.location.origin) return;
      if (event.data.source !== 'shopify-auth') return;

      setLoading(false);

      if (event.data.status === 'success') {
        const returnTo = event.data.returnTo || sessionStorage.getItem('auth_return_to') || from || '/account';
        sessionStorage.removeItem('auth_return_to');
        navigate(returnTo, { replace: true });
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [navigate, from]);

  return (
    <>
      <Helmet>
        <title>{t('auth.login.title')} - {shopInfo?.name || 'B2 Goalkeeping'}</title>
      </Helmet>
      <div className="container mx-auto px-4 pt-32 pb-20 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg p-8 space-y-8 bg-gray-900/50 border border-green-500/20 rounded-2xl shadow-2xl shadow-green-500/10"
        >
          <div className="text-center">
            <AnimatedGradientText className="text-4xl mb-2">
              {t('auth.login.header') || 'Welcome Back'}
            </AnimatedGradientText>
            <p className="text-gray-400">{t('auth.login.subheader') || 'Sign in to your account'}</p>
          </div>

          <Tabs defaultValue="inapp" className="w-full">
            <TabsList className={`grid w-full ${showShopifyLogin ? 'grid-cols-2' : 'grid-cols-1'} bg-gray-800/50`}>
              <TabsTrigger value="inapp" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Secure Login</span>
              </TabsTrigger>
              {showShopifyLogin && (
                <TabsTrigger value="shopify" className="flex items-center space-x-2">
                  <ExternalLink className="h-4 w-4" />
                  <span>Quick Login</span>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="inapp" className="space-y-4 mt-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <h3 className="text-blue-400 font-medium text-sm">Enhanced Security</h3>
                    <p className="text-gray-300 text-xs mt-1">
                      Email verification with secure login directly in our app
                    </p>
                  </div>
                </div>
              </div>
              
              <InAppLogin />
            </TabsContent>

            {showShopifyLogin && (
              <TabsContent value="shopify" className="space-y-4 mt-6">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <ExternalLink className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div>
                      <h3 className="text-yellow-400 font-medium text-sm">Quick Access</h3>
                      <p className="text-gray-300 text-xs mt-1">
                        Use Google, Facebook, or email/password via Shopify
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {isCustomerAuthConfigured() ? (
                    <>
                      <Button
                        onClick={handleSecureLogin}
                        className="w-full bg-green-500 hover:bg-green-600 text-black font-bold text-lg py-6"
                      >
                        {t('auth.login.secureLoginButton') || 'Login with Customer Account API'}
                        <LogIn className="ml-2 h-5 w-5" />
                      </Button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-700" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="bg-gray-900/50 px-2 text-gray-400">{t('auth.or') || 'or'}</span>
                        </div>
                      </div>

                      <Button
                        onClick={handleHostedLogin}
                        className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium text-base py-4"
                      >
                        {t('auth.login.quickLoginButton') || 'Login via Shopify'}
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleHostedLogin}
                      className="w-full bg-green-500 hover:bg-green-600 text-black font-bold text-lg py-6"
                    >
                      {t('auth.login.shopLoginButton') || 'Login with Shopify'}
                      <ExternalLink className="ml-2 h-5 w-5" />
                    </Button>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>

          <div className="text-center text-sm text-gray-400">
            <p className="mt-6">
              {t('auth.login.noAccount') || "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={handleHostedRegister}
                className="font-medium text-green-400 hover:text-green-300 underline decoration-dotted"
              >
                {t('auth.login.registerNow') || 'Register now'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default LoginPage;
