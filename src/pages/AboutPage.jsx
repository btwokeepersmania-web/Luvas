import React from 'react';
import About from '@/components/About.jsx';
import Reviews from '@/components/Reviews.jsx';
import SocialMediaFeed from '@/components/SocialMedia.jsx';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useShopify } from '@/context/ShopifyContext.jsx';

const AboutPage = () => {
  const { t } = useTranslation();
  const { shopInfo } = useShopify();
  const shopName = shopInfo?.name || 'B2 Goalkeeping';

  return (
    <>
      <Helmet>
        <title>{`${t('About')} - ${shopName}`}</title>
        <meta name="description" content={t('about.subtitle')} />
        <meta property="og:title" content={`${t('About')} - ${shopName}`} />
        <meta property="og:description" content={t('about.subtitle')} />
      </Helmet>
      <div className="pt-24 bg-gray-950">
        <About />
        <Reviews />
        <SocialMediaFeed />
      </div>
    </>
  );
};

export default AboutPage;