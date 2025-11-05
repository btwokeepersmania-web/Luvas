import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import ReviewButton from '@/components/ReviewButton.jsx';
import { useTranslation } from 'react-i18next';
import { loadElfsightPlatform } from '@/lib/elfsight.js';

const Reviews = () => {
  const { t } = useTranslation();
  const elfsightEnabled = import.meta.env.VITE_ELFSIGHT_ENABLE === 'true';

  useEffect(() => {
    if (!elfsightEnabled) return undefined;

    let cancelled = false;
    loadElfsightPlatform().catch((error) => {
      if (!cancelled) {
        console.warn('Failed to initialise Elfsight reviews widget', error);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [elfsightEnabled]);

  return (
    <section id="reviews" className="py-20 bg-gray-950 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            {t('reviews.elfsightTitle')}
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {t('reviews.elfsightDescription')}
          </p>
        </motion.div>
      </div>

      {/* Elfsight All-in-One Reviews Widget: load only in production to avoid dev preview fetch errors */}
      <div className="container mx-auto px-4 my-16">
        {elfsightEnabled ? (
          <div id="elfsight-reviews" className="elfsight-app-334fbb31-c526-42e1-af48-eb22eb6e4f23" data-elfsight-app-lazy />
        ) : (
          <div className="text-center text-gray-500 py-12">Reviews widget disabled in this build</div>
        )}
      </div>

      <div className="text-center mt-16">
        <ReviewButton className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-4 text-lg neon-glow" />
      </div>
    </section>
  );
};

export default Reviews;
