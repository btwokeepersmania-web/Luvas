import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useShopify } from '@/context/ShopifyContext.jsx';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { toast } from '@/components/ui/use-toast.js';
import { ArrowRight, Loader2 } from 'lucide-react';

const EmailSubscription = () => {
  const { t } = useTranslation();
  const { subscribeToEmailMarketing } = useShopify();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: t('emailSubscription.error.invalid.title'),
        description: t('emailSubscription.error.invalid.description'),
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      await subscribeToEmailMarketing(email);
      toast({
        title: t('emailSubscription.success.title'),
        description: t('emailSubscription.success.description'),
      });
      setEmail('');
    } catch (error) {
      toast({
        title: t('emailSubscription.error.api.title'),
        description: error.message || t('emailSubscription.error.api.description'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-gray-950 py-16">
      <div className="container mx-auto px-4 max-w-2xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">{t('emailSubscription.title')}</h2>
          <p className="text-gray-400 mb-8">{t('emailSubscription.subtitle')}</p>
          <form onSubmit={handleSubmit} className="relative max-w-lg mx-auto">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailSubscription.placeholder')}
              required
              className="w-full h-14 pl-6 pr-16 rounded-full bg-gray-900 border-yellow-500/30 text-white placeholder:text-gray-400 focus:border-yellow-500"
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-yellow-500 hover:bg-yellow-600 text-black"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
            </Button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default EmailSubscription;