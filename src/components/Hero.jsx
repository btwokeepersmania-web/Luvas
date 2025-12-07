import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button.jsx';
import { Link } from 'react-router-dom';

const Hero = () => {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[80vh] md:h-screen flex items-center justify-center text-center text-white overflow-hidden px-4">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          src="/Videos/survive.mp4"
          autoPlay
          loop
          muted
          playsInline
          aria-label={t('hero.backgroundAlt')}
          className="w-full h-full object-cover hero-video"
        />
        <div className="absolute inset-0 bg-gray-950/50 md:bg-gray-950/40 hero-shadow" />
      </div>

      <div className="relative z-10 container mx-auto px-4">
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold uppercase tracking-wider drop-shadow-[0_6px_25px_rgba(0,0,0,0.45)]"
        >
          {t('hero.title.line1')}
          <br />
          <span className="gradient-text">{t('hero.title.line2')}</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          className="mt-5 sm:mt-6 max-w-3xl mx-auto text-base sm:text-lg md:text-xl text-gray-100 drop-shadow-[0_4px_15px_rgba(0,0,0,0.55)]"
        >
          {t('hero.subtitle')}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
          className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <Link to="/shop" className="w-full sm:w-auto">
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-4 text-base sm:text-lg neon-glow w-full">
              {t('hero.shopNow')}
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
