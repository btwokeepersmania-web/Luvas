import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.jsx';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Loader2, UserPlus } from 'lucide-react';

const RegisterPage = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await register({ firstName, lastName, email, password });
    setLoading(false);
    if (result.success) {
      navigate('/account/login');
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('auth.register.title')} - B2 Goalkeeping</title>
      </Helmet>
      <div className="container mx-auto px-4 pt-32 pb-20 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md p-8 space-y-8 bg-gray-900/50 border border-green-500/20 rounded-2xl shadow-2xl shadow-green-500/10"
        >
          <div className="text-center">
            <h1 className="text-4xl font-bold gradient-text mb-2">{t('auth.register.header')}</h1>
            <p className="text-gray-400">{t('auth.register.subheader')}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-4">
              <div className="space-y-2 w-1/2">
                <Label htmlFor="firstName" className="text-gray-300">{t('auth.firstName')}</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder={t('auth.firstName')} className="bg-gray-900 border-gray-700 focus:border-green-500 focus:ring-green-500" />
              </div>
              <div className="space-y-2 w-1/2">
                <Label htmlFor="lastName" className="text-gray-300">{t('auth.lastName')}</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder={t('auth.lastName')} className="bg-gray-900 border-gray-700 focus:border-green-500 focus:ring-green-500" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">{t('auth.email')}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className="bg-gray-900 border-gray-700 focus:border-green-500 focus:ring-green-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">{t('auth.password')}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="bg-gray-900 border-gray-700 focus:border-green-500 focus:ring-green-500" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-green-500 hover:bg-green-600 text-black font-bold text-lg py-6">
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
              {t('auth.register.button')}
            </Button>
          </form>
          <div className="text-center text-sm text-gray-400">
            <p>
              {t('auth.register.haveAccount')}{' '}
              <Link to="/account/login" className="font-medium text-green-400 hover:text-green-300">
                {t('auth.register.loginNow')}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default RegisterPage;