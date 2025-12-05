import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useShopify } from '@/context/ShopifyContext.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { buildMetaDescription, buildPageTitle } from '@/lib/seo.js';

const PolicyPage = () => {
  const { handle } = useParams();
  const { fetchPolicy, shopInfo } = useShopify();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const siteName = shopInfo?.name || 'B2 Goalkeeping';

  useEffect(() => {
    const getPolicyData = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedPolicy = await fetchPolicy(handle);
        if (fetchedPolicy) {
          setPolicy(fetchedPolicy);
        } else {
          setError('policy.error.notFound');
        }
      } catch (err) {
        setError('policy.error.loadFailed');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (handle && fetchPolicy) {
        getPolicyData();
    }
  }, [handle, fetchPolicy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="h-16 w-16 animate-spin text-green-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-center px-4">
        <h1 className="text-3xl font-bold text-red-500 mb-4">{t(error)}</h1>
        <Button onClick={() => navigate('/')} className="bg-green-500 hover:bg-green-600 text-black">
          {t('policy.error.backButton')}
        </Button>
      </div>
    );
  }

  if (!policy) return null;
  const pageTitle = buildPageTitle(policy.title, siteName);
  const fallbackDescription = t('policy.metaFallback', { title: policy.title, shopName: siteName });
  const metaDescription = buildMetaDescription(policy.body, fallbackDescription);

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        {metaDescription && <meta name="description" content={metaDescription} />}
        <meta property="og:title" content={pageTitle} />
        {metaDescription && <meta property="og:description" content={metaDescription} />}
      </Helmet>
      <div className="pt-32 pb-20 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="prose prose-invert prose-lg max-w-4xl mx-auto prose-h1:gradient-text prose-h1:mb-8 prose-a:text-green-400 hover:prose-a:text-green-300 prose-strong:text-white"
          >
            <h1>{policy.title}</h1>
            <div dangerouslySetInnerHTML={{ __html: policy.body }} />
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default PolicyPage;
