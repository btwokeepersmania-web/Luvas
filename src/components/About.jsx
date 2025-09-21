import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Shield, Target, Trophy, Users } from 'lucide-react';
import AnimatedGradientText from '@/components/ui/animated-gradient-text.jsx';

const About = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Shield,
      title: t('about.features.protection.title'),
      description: t('about.features.protection.description')
    },
    {
      icon: Target,
      title: t('about.features.precision.title'),
      description: t('about.features.precision.description')
    },
    {
      icon: Trophy,
      title: t('about.features.performance.title'),
      description: t('about.features.performance.description')
    },
    {
      icon: Users,
      title: t('about.features.levels.title'),
      description: t('about.features.levels.description')
    }
  ];

  return (
    <section id="sobre" className="py-20 bg-gray-950">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <AnimatedGradientText className="text-4xl md:text-5xl mb-6">
              {t('about.title')}
            </AnimatedGradientText>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              {t('about.subtitle')}
            </p>

            <p className="text-lg text-gray-400 mb-6 leading-relaxed">
              {t('about.mission')}
            </p>

            {/* Care instructions callout */}
            <div className="mb-8">
              <div className="bg-gray-900 border border-yellow-500/20 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-white">{t('care.title')}</h4>
                  <p className="text-gray-300 text-sm mt-1">{t('care.subtitle')}</p>
                </div>
                <div>
                  <a href="/care" className="inline-block bg-yellow-500 text-black px-4 py-2 rounded-md font-semibold">{t('care.learnMore') || 'Read'}</a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start space-x-4 p-4 rounded-lg bg-gray-900 border border-yellow-500/20 hover:border-yellow-500/40 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <feature.icon className="h-8 w-8 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden aspect-square max-h-[600px]">
              <img
                alt="Professional goalkeeper wearing B2 Goalkeeping gloves"
                className="w-full h-full object-cover rounded-2xl"
               src="https://images.unsplash.com/photo-1629473714631-e02d38f47f06" loading="lazy" decoding="async" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 via-transparent to-transparent rounded-2xl" />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="absolute top-6 right-6 bg-gray-950/80 backdrop-blur-sm rounded-lg p-4 border border-yellow-500/30"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">500+</div>
                  <div className="text-sm text-gray-300">{t('about.stats.proGoalkeepers')}</div>
                </div>
              </motion.div>
              

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                viewport={{ once: true }}
                className="absolute bottom-6 left-6 bg-gray-950/80 backdrop-blur-sm rounded-lg p-4 border border-yellow-500/30"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">15+</div>
                  <div className="text-sm text-gray-300">{t('about.stats.experience')}</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
