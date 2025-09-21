import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useShopify } from '@/context/ShopifyContext.jsx';
import ProductCard from '@/components/ProductCard.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet';

const CollectionPage = () => {
  const { handle } = useParams();
  const { fetchCollectionByHandle, fetchCollectionProducts, loading: shopifyLoading } = useShopify();
  const { t } = useTranslation();
  const [collection, setCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [highlighted, setHighlighted] = useState(false);

  // Highlight hero image shortly after load to draw attention
  useEffect(() => {
    const timer = setTimeout(() => setHighlighted(true), 900);
    return () => clearTimeout(timer);
  }, []);

  const toggleHighlight = () => setHighlighted(prev => !prev);

  useEffect(() => {
    const getCollectionData = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedCollection = await fetchCollectionByHandle(handle);
        if (fetchedCollection) {
          setCollection(fetchedCollection);
          const fetchedProducts = await fetchCollectionProducts(fetchedCollection.id);
          setProducts(Array.isArray(fetchedProducts) ? fetchedProducts : []);
        } else {
          setError(t('collections.error.noneFound'));
        }
      } catch (err) {
        setError(err.message || t('collections.error.loadFailed'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    // Only fetch when shopify context finished initial load (localization initialized)
    if (!shopifyLoading) {
      getCollectionData();
    }
  }, [handle, fetchCollectionByHandle, fetchCollectionProducts, t, shopifyLoading]);

  const cardVariants = {
    offscreen: { y: 50, opacity: 0 },
    onscreen: (i) => ({
      y: 0,
      opacity: 1,
      transition: { type: 'spring', bounce: 0.4, duration: 0.8, delay: i * 0.1 },
    }),
  };

  const imageUrl = collection?.image?.url || 'https://source.unsplash.com/random/1600x900?soccer,goalkeeper';
  const imageAlt = collection?.image?.altText || collection?.title;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <Loader2 className="h-16 w-16 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-center px-4">
        <h1 className="text-3xl font-bold text-red-500 mb-4">{error}</h1>
        <Link to="/">
          <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">{t('Back to Home')}</Button>
        </Link>
      </div>
    );
  }

  if (!collection) return null;

  return (
    <>
      <Helmet>
        <title>{`${collection.title} - B2 Goalkeeping`}</title>
        <meta name="description" content={collection.description} />
        <meta property="og:title" content={`${collection.title} - B2 Goalkeeping`} />
        <meta property="og:description" content={collection.description} />
        <meta property="og:image" content={imageUrl} />
      </Helmet>
      <div className="pt-24 pb-20 bg-gray-950">
        <div className="relative h-64 md:h-96 flex items-center justify-center text-center overflow-hidden">
          <motion.img
            src={imageUrl}
            alt={imageAlt}
            initial={{ scale: 1, filter: 'blur(2px)' }}
            animate={highlighted ? { scale: 0.96, filter: 'blur(0px)' } : { scale: 1.02, filter: 'blur(2px)' }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute inset-0 w-full h-full object-cover will-change-transform cursor-zoom-in"
            style={{ transformOrigin: 'center center' }}
            onClick={toggleHighlight}
          />

          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-black/55 via-gray-950/35 to-black/45"
            initial={{ opacity: 0.6 }}
            animate={highlighted ? { opacity: 0.18 } : { opacity: 0.6 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />

        </div>


        {/* Title surfaced outside the hero */}
        <div className="container mx-auto px-4 mt-6">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-4xl md:text-6xl font-extrabold gradient-text drop-shadow-xl text-center mb-6">
            {collection.title}
          </motion.h1>
        </div>

        {/* Collection description and care banner placed outside the hero for better readability */}
        <div className="container mx-auto px-4 mt-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-gray-200 text-base md:text-lg leading-relaxed">{collection.description}</p>

          </div>
        </div>

        <div className="container mx-auto px-4 mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
            {(Array.isArray(products) ? products : []).map((product, index) => (
              <motion.div
                key={product.id || index}
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
          {(!Array.isArray(products) || products.length === 0) && !loading && (
            <div className="text-center py-12 col-span-full">
              <p className="text-gray-400 text-lg">{t('collections.error.noneFound')}</p>
              <div className="mt-4">
                <Button onClick={async () => {
                  try {
                    setLoading(true);
                    const retry = await fetchCollectionProducts(collection.id);
                    setProducts(Array.isArray(retry) ? retry : []);
                  } catch (e) {
                    console.error('Retry fetch collection products failed', e);
                    setProducts([]);
                  } finally {
                    setLoading(false);
                  }
                }} className="bg-yellow-500 hover:bg-yellow-600 text-black">{t('collections.retry') || 'Retry'}</Button>
              </div>
            </div>
          )}

          {/* On small screens, show the collection description below the grid for readability */}
          <div className="mt-8 block md:hidden max-w-3xl mx-auto px-4">
            <p className="text-gray-300 text-base">{collection.description}</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default CollectionPage;
