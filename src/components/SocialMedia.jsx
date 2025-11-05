import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { loadElfsightPlatform } from '@/lib/elfsight.js';

const SocialMedia = () => {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const [shouldLoadWidget, setShouldLoadWidget] = useState(false);
  const elfsightEnabled = import.meta.env?.VITE_ELFSIGHT_ENABLE === 'true';

  // Defer third-party script loading until the section is near the viewport.
  useEffect(() => {
    if (!elfsightEnabled) return;
    const node = containerRef.current;

    if (!node || typeof IntersectionObserver === 'undefined') {
      setShouldLoadWidget(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoadWidget(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [elfsightEnabled]);

  useEffect(() => {
    if (!shouldLoadWidget || !elfsightEnabled) return undefined;

    let cancelled = false;
    loadElfsightPlatform().catch(() => {
      if (!cancelled && containerRef.current) {
        containerRef.current.style.display = 'none';
      }
    });

    return () => {
      cancelled = true;
    };
  }, [shouldLoadWidget, elfsightEnabled]);

  return (
    <section className="py-20 bg-gray-950">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            {t('socialMedia.title')}
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {t('socialMedia.caption')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div
            ref={containerRef}
            id="elfsight-container"
            className="elfsight-app-7c2db332-b593-4048-be1a-e1a5df293af9"
            data-elfsight-app-lazy
          />
        </motion.div>
      </div>
    </section>
  );
};

export default SocialMedia;
