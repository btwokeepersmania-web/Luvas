import React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const steps = [
  {
    titleKey: 'care.step1.title',
    textKey: 'care.step1.text'
  },
  {
    titleKey: 'care.step2.title',
    textKey: 'care.step2.text'
  },
  {
    titleKey: 'care.step3.title',
    textKey: 'care.step3.text'
  },
  {
    titleKey: 'care.step4.title',
    textKey: 'care.step4.text'
  },
  {
    titleKey: 'care.step5.title',
    textKey: 'care.step5.text'
  },
  {
    titleKey: 'care.step6.title',
    textKey: 'care.step6.text'
  },
  {
    titleKey: 'care.step7.title',
    textKey: 'care.step7.text'
  }
];

const CareInstructionsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-white py-20 px-4">
      <Helmet>
        <title>{t('care.title')} - B2 Goalkeeping</title>
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <motion.h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {t('care.title')}
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-gray-300 mb-6">
          {t('care.subtitle')}
        </motion.p>

        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-xl mb-2">{t('care.videoTitle')}</h3>
          <p className="text-gray-400 mb-4">{t('care.videoDescription')}</p>
          <div className="aspect-video bg-black/60 rounded-md flex items-center justify-center text-gray-400">Video placeholder — embed your video here</div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-3">{t('care.guideTitle')}</h2>
          <p className="text-gray-300 mb-4">{t('care.guideIntro')}</p>
        </div>

        <div className="space-y-6">
          {steps.map((s, idx) => (
            <div key={s.titleKey} className="bg-gray-900 p-4 rounded-md">
              <h4 className="font-semibold text-lg">{t(s.titleKey)}</h4>
              <p className="text-gray-300 mt-2">{t(s.textKey)}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-center gap-4">
          <button onClick={() => navigate('/')} className="bg-green-500 hover:bg-green-600 text-black font-bold px-5 py-3 rounded">{t('care.backToShop')}</button>
        </div>
      </div>
    </div>
  );
};

export default CareInstructionsPage;
