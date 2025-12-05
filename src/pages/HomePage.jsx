import React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import Hero from '@/components/Hero.jsx';
import Collections from '@/components/Collections.jsx';
import About from '@/components/About.jsx';
import Reviews from '@/components/Reviews.jsx';
import SocialMediaFeed from '@/components/SocialMedia.jsx';
import EmailSubscription from '@/components/EmailSubscription.jsx';
import Contact from '@/components/Contact.jsx';
import { useShopify } from '@/context/ShopifyContext.jsx';
import { buildMetaDescription, buildPageTitle } from '@/lib/seo.js';

const HomePage = () => {
  const { t } = useTranslation();
  const { shopInfo } = useShopify();
  const siteName = shopInfo?.name || 'B2 Goalkeeping';
  const pageTitle = buildPageTitle('Professional Goalkeeper Gloves', siteName);
  const metaDescription = buildMetaDescription(t('home.metaDescription'), t('hero.subtitle'));

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        {metaDescription && <meta name="description" content={metaDescription} />}
        <meta property="og:title" content={pageTitle} />
        {metaDescription && <meta property="og:description" content={metaDescription} />}
      </Helmet>
      <Hero />
      <Collections />
      <About />
      <Reviews />
      <SocialMediaFeed />
      <Contact />
      <EmailSubscription />
    </>
  );
};

export default HomePage;
