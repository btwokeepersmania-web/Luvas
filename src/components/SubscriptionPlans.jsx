import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useShopify } from '@/context/ShopifyContext.jsx';
import { useLocalization } from '@/context/LocalizationContext.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Loader2, CheckCircle, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/use-toast.js';

const SubscriptionPlans = () => {
  const { fetchSubscriptionPlans, createCartAndGetCheckoutUrl } = useShopify();
  const { formatPrice } = useLocalization();
  const { t } = useTranslation();
  const { customer, token } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribingId, setSubscribingId] = useState(null);

  useEffect(() => {
    const getPlans = async () => {
      setLoading(true);
      try {
        const fetchedPlans = await fetchSubscriptionPlans();
        setPlans(fetchedPlans);
      } catch (error) {
        console.error("Failed to fetch subscription plans:", error);
      } finally {
        setLoading(false);
      }
    };
    getPlans();
  }, [fetchSubscriptionPlans]);

  const handleSubscribe = async (plan, sellingPlanId) => {
    setSubscribingId(sellingPlanId);
    try {
      const lineItems = [{
        variantId: plan.variantId,
        quantity: 1,
        sellingPlanId: sellingPlanId,
      }];
      // Use default address if customer is logged in and has one
      const defaultAddress = customer?.defaultAddress;
      const shippingAddress = defaultAddress ? {
        firstName: defaultAddress.firstName || customer?.firstName || '',
        lastName: defaultAddress.lastName || customer?.lastName || '',
        company: defaultAddress.company || '',
        address1: defaultAddress.address1,
        address2: defaultAddress.address2 || '',
        city: defaultAddress.city,
        province: defaultAddress.province || '',
        zip: defaultAddress.zip || '',
        country: defaultAddress.country,
        phone: defaultAddress.phone || customer?.phone || '',
      } : null;

      const checkoutUrl = await createCartAndGetCheckoutUrl(lineItems, token, null, shippingAddress);
      window.location.href = checkoutUrl;
    } catch (error) {
      toast({
        title: t('subscription.error.title'),
        description: t('subscription.error.description'),
        variant: "destructive",
      });
      console.error("Failed to create subscription checkout:", error);
    } finally {
      setSubscribingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (plans.length === 0) {
    return null;
  }

  return (
    <section id="subscriptions" className="py-20 bg-black">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">{t('subscription.title')}</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">{t('subscription.subtitle')}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan, planIndex) => (
            <motion.div
              key={plan.productId}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: planIndex * 0.1 }}
              viewport={{ once: true }}
              className="bg-gray-900/50 border border-green-500/20 rounded-xl p-8 flex flex-col hover:border-green-500 hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-300"
            >
              <div className="flex-grow">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Package className="w-10 h-10 text-green-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-center text-white mb-2">{plan.title}</h3>
                <p className="text-gray-400 text-center mb-8 h-20">{plan.description}</p>
                <ul className="space-y-4 mb-10">
                  {plan.sellingPlanGroups.flatMap(group => group.sellingPlans.edges).map(({node: sellingPlan}, index) => (
                     <li key={sellingPlan.id} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-1 flex-shrink-0" />
                        <div>
                            <span className="text-white font-semibold">{sellingPlan.name}</span>
                            <p className="text-gray-400 text-sm">{sellingPlan.description}</p>
                        </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-auto">
                {plan.sellingPlanGroups.flatMap(group => group.sellingPlans.edges).map(({node: sellingPlan}) => (
                   <Button 
                    key={sellingPlan.id}
                    onClick={() => handleSubscribe(plan, sellingPlan.id)}
                    disabled={subscribingId === sellingPlan.id}
                    className="w-full bg-green-500 hover:bg-green-600 text-black font-bold text-lg mb-2 neon-glow"
                  >
                    {subscribingId === sellingPlan.id ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      `${t('subscription.button.subscribe')} - ${formatPrice(plan.price, plan.currency)} / ${t('subscription.button.month')}`
                    )}
                   </Button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SubscriptionPlans;
