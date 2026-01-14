import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button.jsx';

const Hero = () => {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[80vh] md:h-screen text-white overflow-hidden">
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/hero/survive.png"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover scale-105 opacity-60 saturate-110"
        >
          <source
            src="/Videos/Reels_Video_btwowinter30OFF.mp4"
            type="video/mp4"
            media="(max-width: 767px)"
          />
          <source src="/Videos/wintersale.mp4" type="video/mp4" />
        </video>
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/hero/survive.png"
          aria-label={t('hero.backgroundAlt')}
          className="relative z-10 h-full w-full object-contain hero-video"
        >
          <source
            src="/Videos/Reels_Video_btwowinter30OFF.mp4"
            type="video/mp4"
            media="(max-width: 767px)"
          />
          <source src="/Videos/wintersale.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 z-20 bg-gradient-to-b from-black/35 via-black/10 to-black/35 hero-shadow" />
      </div>
      <div className="absolute inset-0 z-10 flex items-end justify-center pb-10 md:pb-16">
        <Button
          asChild
          size="lg"
          className="neon-glow rounded-full bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-500 text-black font-semibold uppercase tracking-[0.24em] shadow-[0_12px_28px_rgba(234,179,8,0.35)] transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(234,179,8,0.45)]"
        >
          <Link to="/shop">SHOP NOW</Link>
        </Button>
      </div>
    </section>
  );
};

export default Hero;
