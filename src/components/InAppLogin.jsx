import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Loader2, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast.js';
import { useAuth } from '@/context/AuthContext.jsx';
import { useNavigate, useLocation } from 'react-router-dom';

const InAppLogin = () => {
  const [step, setStep] = useState('email'); // 'email' | 'verification' | 'success'
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/account';

  // Send verification code
  const handleSendCode = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: t('auth.login.error'),
        description: 'Please enter your email address',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/.netlify/functions/auth-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send-code',
          email: email.toLowerCase().trim()
        })
      });

      // handle non-JSON or error bodies gracefully
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Verification service not found (404)');
          toast({ title: t('auth.login.error'), description: 'Verification service unavailable (404). Please try again later or contact support.', variant: 'destructive' });
          setLoading(false);
          return;
        }
        let text = '';
        try { text = await response.text(); } catch (e) { text = response.statusText; }
        toast({ title: t('auth.login.error'), description: text || `Request failed with status ${response.status}`, variant: 'destructive' });
        setLoading(false);
        return;
      }

      let data = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try { data = await response.json(); } catch (e) { data = { success: false, error: 'Invalid JSON response' }; }
      } else {
        const text = await response.text();
        data = { success: false, error: text };
      }

      if (data && data.success) {
        setCodeSent(true);
        setStep('verification');
        toast({
          title: 'Verification Code Sent',
          description: `We've sent a 6-digit code to ${email}`,
        });
        
        // In development, show the code in console
        if (data.code) {
          console.log('Development verification code:', data.code);
        }
      } else {
        toast({
          title: t('auth.login.error'),
          description: data.error || 'Failed to send verification code',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Send code error:', error);
      toast({
        title: t('auth.login.error'),
        description: 'Network error. If you run locally, start Netlify dev (netlify dev) or deploy functions. Check console for details.',
        variant: 'destructive',
        duration: 8000
      });
    } finally {
      setLoading(false);
    }
  };

  // Verify code and login
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: t('auth.login.error'),
        description: 'Please enter the 6-digit verification code',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/.netlify/functions/auth-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verify-code',
          email: email.toLowerCase().trim(),
          code: verificationCode
        })
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Verification service not found (404)');
          toast({ title: t('auth.login.error'), description: 'Verification service unavailable (404). Please try again later or contact support.', variant: 'destructive' });
          setLoading(false);
          return;
        }
        let text = '';
        try { text = await response.text(); } catch (e) { text = response.statusText; }
        toast({ title: t('auth.login.error'), description: text || `Request failed with status ${response.status}`, variant: 'destructive' });
        setLoading(false);
        return;
      }

      let data = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try { data = await response.json(); } catch (e) { data = { success: false, error: 'Invalid JSON response' }; }
      } else {
        const text = await response.text();
        data = { success: false, error: text };
      }

      if (data && data.success) {
        // Store auth token and customer data
        localStorage.setItem('customAuthToken', data.authToken);
        localStorage.setItem('customerData', JSON.stringify(data.customer));
        
        setStep('success');
        
        toast({
          title: 'Login Successful',
          description: `Welcome back, ${data.customer.firstName || 'there'}!`,
        });

        // Redirect after a short delay
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 1500);
      } else {
        toast({
          title: t('auth.login.error'),
          description: data.error || 'Invalid verification code',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Verify code error:', error);
      toast({
        title: t('auth.login.error'),
        description: 'Network error. If you run locally, start Netlify dev (netlify dev) or deploy functions. Check console for details.',
        variant: 'destructive',
        duration: 8000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setVerificationCode('');
    setCodeSent(false);
  };

  const handleResendCode = async () => {
    setVerificationCode('');
    await handleSendCode({ preventDefault: () => {} });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {step === 'email' && (
          <motion.div
            key="email"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center">
              <Mail className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                {t('auth.login.inapp.title') || 'Sign In to Your Account'}
              </h2>
              <p className="text-gray-400">
                {t('auth.login.inapp.subtitle') || 'We\'ll send you a verification code'}
              </p>
            </div>

            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-gray-300">
                  {t('auth.email') || 'Email Address'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="mt-1"
                  disabled={loading}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-black font-bold"
                disabled={loading || !email}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </Button>
            </form>
          </motion.div>
        )}

        {step === 'verification' && (
          <motion.div
            key="verification"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="h-12 w-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Check Your Email
              </h2>
              <p className="text-gray-400 mb-1">
                We sent a 6-digit code to
              </p>
              <p className="text-green-400 font-medium">{email}</p>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <Label htmlFor="code" className="text-gray-300">
                  Verification Code
                </Label>
                <Input
                  id="code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="mt-1 text-center text-2xl tracking-widest"
                  disabled={loading}
                  maxLength={6}
                  autoComplete="one-time-code"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-black font-bold"
                disabled={loading || verificationCode.length !== 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Sign In'
                )}
              </Button>
            </form>

            <div className="flex flex-col space-y-2 text-sm">
              <button
                type="button"
                onClick={handleResendCode}
                className="text-green-400 hover:text-green-300 transition-colors"
                disabled={loading}
              >
                Resend code
              </button>
              <button
                type="button"
                onClick={handleBackToEmail}
                className="text-gray-400 hover:text-gray-300 transition-colors flex items-center justify-center"
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Change email address
              </button>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 text-center"
          >
            <div>
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome Back!
              </h2>
              <p className="text-gray-400">
                You've been successfully signed in.
              </p>
            </div>

            <div className="w-full bg-green-500/20 rounded-lg p-4">
              <p className="text-green-400 text-sm">
                Redirecting to your account...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InAppLogin;
