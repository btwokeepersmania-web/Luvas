import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const SocialMedia = () => {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-gray-950">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            {t('socialMedia.title')}
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {t('socialMedia.caption')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div
            id="elfsight-container"
            className="elfsight-app-7c2db332-b593-4048-be1a-e1a5df293af9"
            data-elfsight-app-lazy
          />
        </motion.div>
      </div>
    </section>
  );
};

// Load Elfsight script dynamically only in production and if explicitly enabled via env
if (typeof window !== 'undefined') {
  (function loadElfsight() {
    try {
      const elfsightEnabled = import.meta.env && import.meta.env.VITE_ELFSIGHT_ENABLE === 'true';
      if (!elfsightEnabled) return; // only load when enabled
      if (document.querySelector('script[src="https://elfsightcdn.com/platform.js"]')) return;
      const script = document.createElement('script');
      script.src = 'https://elfsightcdn.com/platform.js';
      script.async = true;
      script.onload = () => {
        // widget initializes itself
      };
      script.onerror = (e) => {
        console.warn('Failed to load Elfsight script', e);
        const container = document.getElementById('elfsight-container');
        if (container) container.style.display = 'none';
      };
      document.body.appendChild(script);
    } catch (e) {
      console.warn('Elfsight load skipped', e);
    }
  })();
}

export default SocialMedia;
