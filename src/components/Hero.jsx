import React from 'react';
import { useTranslation } from 'react-i18next';

const Hero = () => {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[80vh] md:h-screen text-white overflow-hidden">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          src="/Videos/survive.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/hero/survive.png"
          aria-label={t('hero.backgroundAlt')}
          className="w-full h-full object-cover hero-video"
        />
        <div className="absolute inset-0 bg-gray-950/50 md:bg-gray-950/40 hero-shadow" />
      </div>
    </section>
  );
};

export default Hero;
