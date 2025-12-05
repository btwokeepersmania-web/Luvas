import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useShopify } from '@/context/ShopifyContext.jsx';
import { Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet';
import ProductCard from '@/components/ProductCard.jsx';
import ProductFilters from '@/components/ProductFilters.jsx';

const ShopPage = () => {
  const { products, loading, error } = useShopify();
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    sort: 'relevance',
    category: 'all',
    size: 'all',
  });

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    if (filters.category !== 'all') {
      filtered = filtered.filter(p => p.productType === filters.category);
    }

    if (filters.size !== 'all') {
      filtered = filtered.filter(p => 
        p.options.some(opt => 
          opt.name.toLowerCase() === 'size' && opt.values.includes(filters.size)
        )
      );
    }

    switch (filters.sort) {
      case 'price-asc':
        filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'price-desc':
        filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      default:
        break;
    }

    return filtered;
  }, [products, filters]);

  const cardVariants = {
    offscreen: { y: 50, opacity: 0 },
    onscreen: (i) => ({
      y: 0,
      opacity: 1,
      transition: { type: 'spring', bounce: 0.4, duration: 0.8, delay: i * 0.1 },
    }),
  };

  return (
    <>
      <Helmet>
        <title>{t('shop.title')} - BTWO KEEPERS SHOP</title>
        <meta name="description" content={t('shop.metaDescription')} />
        <meta property="og:title" content={`${t('shop.title')} - BTWO KEEPERS SHOP`} />
        <meta property="og:description" content={t('shop.metaDescription')} />
      </Helmet>
      <section id="shop" className="pt-32 pb-20 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
              {t('shop.header')}
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              {t('shop.subheader')}
            </p>
          </motion.div>

          <ProductFilters products={products} filters={filters} setFilters={setFilters} />

          {loading && (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="h-12 w-12 animate-spin text-green-500" />
            </div>
          )}

          {error && !loading && (
            <div className="text-center text-red-400 text-lg p-8 bg-red-900/20 rounded-lg">
              <p>{t('collections.error.loadFailed')}</p>
              <p className="text-sm text-red-300 mt-2">{error}</p>
            </div>
          )}

          {!loading && !error && filteredAndSortedProducts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
              {filteredAndSortedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  custom={index}
                  variants={cardVariants}
                  initial="offscreen"
                  whileInView="onscreen"
                  viewport={{ once: true, amount: 0.3 }}
                  className="w-full max-w-sm"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}

          {!loading && !error && filteredAndSortedProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">{t('shop.noProductsFound')}</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default ShopPage;