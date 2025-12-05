import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CreditCard, Shield, Clock, Globe, Star } from 'lucide-react';
import { useShopify } from '@/context/ShopifyContext.jsx';
import { Button } from '@/components/ui/button.jsx';
import ReviewButton from '@/components/ReviewButton.jsx';

const Footer = () => {
  const { t } = useTranslation();
  const { shopInfo } = useShopify();

  const supportLinks = [
    { label: t('footer.support.help'), path: '/faq' },
    { label: t('footer.support.returns'), path: '/return-policy' },
    { label: t('footer.support.terms'), path: '/terms-of-service' },
    { label: t('footer.support.privacy'), path: '/privacy-policy' },
  ];

  const features = [
    { icon: '/icons/shield.gif', title: t('footer.features.secure.title'), description: t('footer.features.secure.description') },
    { icon: '/icons/truck.gif', title: t('footer.features.shipping.title'), description: t('footer.features.shipping.description') },
    { icon: '/icons/way.gif', title: t('footer.features.delivery.title'), description: t('footer.features.delivery.description') },
    { icon: '/icons/payment.gif', title: t('footer.features.payment.title'), description: t('footer.features.payment.description') }
  ];

  const shopName = shopInfo?.name || "Goalkeeping";

  return (
    <footer className="bg-gray-950 border-t border-yellow-500/20">
      <div className="border-b border-yellow-500/10">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 bg-[#eab308] rounded-full flex items-center justify-center">
                    <img src={feature.icon} alt={feature.title} className="h-12 w-12" />
                  </div>
                </div>
                <span className="text-white font-semibold text-sm block mb-1">{feature.title}</span>
                <span className="text-gray-400 text-xs">{feature.description}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-4 md:col-span-1"
          >
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 flex items-center justify-center overflow-hidden">
                <img
                  src="/logo/logo.svg"
                  alt={`${shopName} Logo`}
                  className="max-w-full max-h-full object-contain drop-shadow-[0_0_8px_rgba(234,179,8,0.35)]"
                />
              </div>
              <span className="text-2xl font-bold gradient-text whitespace-nowrap">{shopName}</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              {t('footer.description')}
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="md:col-span-1"
          >
            <span className="text-white font-semibold text-lg block mb-4">{t('footer.support.title')}</span>
            <div className="space-y-3">
              {supportLinks.map((link, index) => (
                <Link
                  key={index}
                  to={link.path}
                  className="block text-gray-400 hover:text-yellow-400 transition-colors text-sm"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="md:col-span-1"
          >
             <span className="text-white font-semibold text-lg block mb-4">{t('reviews.title')}</span>
             <p className="text-gray-400 text-sm mb-4">
              {t('reviews.subtitle')}
            </p>
             <ReviewButton
               variant="outline"
               className="w-full sm:w-auto border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
             >
               <>
                 <Star className="mr-2 h-4 w-4" />
                 {t('footer.leaveReview')}
               </>
             </ReviewButton>
          </motion.div>
        </div>
      </div>

      <div className="border-t border-yellow-500/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm text-center md:text-left">
              {`© ${new Date().getFullYear()} ${shopName}. ${t('footer.copyright')}`}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
