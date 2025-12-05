import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const ComingSoonPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white text-center px-4">
      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-5xl md:text-7xl font-bold mb-4 gradient-text"
      >
        {t('comingSoon.title')}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="text-lg md:text-xl text-gray-300 max-w-2xl mb-8"
      >
        {t('comingSoon.message')}
      </motion.p>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="text-md md:text-lg text-gray-400"
      >
        <p>{t('comingSoon.stayTuned')}</p>
      </motion.div>
    </div>
  );
};

export default ComingSoonPage;
