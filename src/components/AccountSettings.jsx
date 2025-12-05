import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Settings, Shield, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button.jsx';

const AccountSettings = () => {
  const { t } = useTranslation();
  const shopifyAccountUrl = `https://${import.meta.env.VITE_SHOPIFY_DOMAIN}/account`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gray-900 border-yellow-500/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl text-yellow-400">
            <Settings />
            {t('account.settings')}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {t('account.settingsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-800 rounded-lg">
            <div>
              <h3 className="font-semibold text-white">{t('account.manageAccount')}</h3>
              <p className="text-sm text-gray-400 max-w-md mt-1">{t('account.manageAccountDescription')}</p>
            </div>
            <a href={shopifyAccountUrl} target="_blank" rel="noopener noreferrer" className="mt-4 sm:mt-0">
              <Button variant="outline" className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10">
                {t('account.goToShopify')} <ExternalLink className="ml-2 h-4 w-4"/>
              </Button>
            </a>
          </div>
          
          <div className="flex items-start gap-4 p-4 bg-gray-800 rounded-lg">
            <Shield className="w-8 h-8 text-yellow-400 mt-1 flex-shrink-0" />
            <div>
                <h3 className="font-semibold text-white">{t('account.security')}</h3>
                <p className="text-sm text-gray-400">{t('account.securityDescription')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AccountSettings;