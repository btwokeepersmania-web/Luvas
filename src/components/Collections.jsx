import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button.jsx';
import { useShopify } from '@/context/ShopifyContext.jsx';
import { Loader2, ArrowRight } from 'lucide-react';
import AnimatedGradientText from '@/components/ui/animated-gradient-text.jsx';

const Collections = () => {
  const { collections, loading, error } = useShopify();
  const { t } = useTranslation();

  return (
    <section id="colecoes" className="py-20 bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <AnimatedGradientText className="text-4xl md:text-5xl mb-6">
            {t('collections.title')}
          </AnimatedGradientText>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-gray-300 max-w-2xl mx-auto"
          >
            {t('collections.subtitle')}
          </motion.p>
        </div>

        {loading && (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="h-12 w-12 animate-spin text-yellow-500" />
          </div>
        )}

        {error && !loading && (
          <div className="text-center text-red-400 text-lg p-8 bg-red-900/20 rounded-lg">
             <p>{t('collections.error.loadFailed')}</p>
             <p className="text-sm text-red-300 mt-2">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          {collections.map((collection, index) => {
            const imageUrl = collection.image?.url || `https://source.unsplash.com/random/400x400?soccer,goalkeeper,${collection.handle}`;
            const imageAlt = collection.image?.altText || collection.title;

            return (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, zIndex: 10, y: -5 }}
                viewport={{ once: true }}
                className="w-full max-w-sm"
              >
                <Link to={`/collections/${collection.handle}`} className="collection-card rounded-lg overflow-hidden group cursor-pointer block">
                  <div className="relative overflow-hidden h-60">
                    <img
                      src={imageUrl}
                      alt={imageAlt}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {collection.title}
                      </h3>
                      <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                        {collection.description || t('collections.defaultDescription')}
                      </p>
                      
                      <Button
                        variant="outline"
                        className="border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black group-hover:translate-x-2 transition-all duration-300"
                      >
                        {t('View Collection')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>

        {collections.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">{t('collections.error.noneFound')}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Collections;
