import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button.jsx';
import { Link } from 'react-router-dom';

const Hero = () => {
  const { t } = useTranslation();

  return (
    <section className="relative h-screen flex items-center justify-center text-center text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-black flex items-center justify-center">
          <img
            src={import.meta.env.VITE_HERO_IMAGE_URL || '/hero/bgimg.jpeg'}
            alt={t('hero.backgroundAlt')}
            className="max-w-full max-h-full object-contain"
            loading="eager"
          />
        </div>
        <div className="absolute inset-0 bg-gray-950/60 hero-shadow"></div>
      </div>

      <div className="relative z-20 container mx-auto px-4">
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold uppercase tracking-wider"
        >
          {t('hero.title.line1')}
          <br />
          <span className="gradient-text">{t('hero.title.line2')}</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-gray-300"
        >
          {t('hero.subtitle')}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/shop">
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-4 text-lg neon-glow w-full sm:w-auto">
              {t('hero.shopNow')}
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
