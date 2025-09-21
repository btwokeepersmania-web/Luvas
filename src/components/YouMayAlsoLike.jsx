import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useShopify } from '@/context/ShopifyContext.jsx';
import ProductCard from '@/components/ProductCard.jsx';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

const YouMayAlsoLike = ({ currentProductHandle }) => {
  const { products, loading } = useShopify();
  const { t } = useTranslation();

  const recommendedProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    const filtered = products.filter(p => p.handle !== currentProductHandle);
    
    return filtered.sort(() => 0.5 - Math.random()).slice(0, 4);
  }, [products, currentProductHandle]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (recommendedProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-gray-950 border-t border-yellow-500/10">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            {t('You may also like')}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {recommendedProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default YouMayAlsoLike;