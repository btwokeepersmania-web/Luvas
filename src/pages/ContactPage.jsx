import React from 'react';
import Contact from '@/components/Contact.jsx';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import EmailSubscription from '@/components/EmailSubscription.jsx';

const ContactPage = () => {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{`${t('Contact')} - B2 Goalkeeping`}</title>
        <meta name="description" content={t('contact.subtitle')} />
        <meta property="og:title" content={`${t('Contact')} - B2 Goalkeeping`} />
        <meta property="og:description" content={t('contact.subtitle')} />
      </Helmet>
      <div className="pt-24 bg-gray-950">
        <Contact />
        <EmailSubscription />
      </div>
    </>
  );
};

export default ContactPage;