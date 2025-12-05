import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { loadElfsightPlatform } from '@/lib/elfsight.js';
import { Instagram, FacebookIcon, Youtube, Navigation, X } from 'lucide-react';

const TikTokIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

const SOCIAL_LINKS = [
  {
    id: 'instagram',
    label: 'Instagram',
    href: 'https://www.instagram.com/b2_gkgloves/',
    description: 'Fresh drops, behind-the-scenes content, and community saves.',
    icon: Instagram,
    accent: 'hover:border-pink-400/60 hover:text-pink-300'
  },
  {
    id: 'facebook',
    label: 'Facebook',
    href: 'https://www.facebook.com/Bgkgloves?rdid=M9Tta4be4yEtmKFT&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F16qSQQDAy6%2F#',
    description: 'Join the B2 family, share match moments, and get support updates.',
    icon: FacebookIcon,
    accent: 'hover:border-blue-500/60 hover:text-blue-300'
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    href: 'https://www.tiktok.com/@b2_gkgloves?_t=ZN-8zVPv2KJIdq&_r=1',
    description: 'Quick training drills, glove care tips, and fun keeper challenges.',
    icon: TikTokIcon,
    accent: 'hover:border-white/60 hover:text-white'
  },
  {
    id: 'x',
    label: 'X (Twitter)',
    href: 'https://x.com/BGkgloves',
    description: 'Match-day updates, product restocks, and live event coverage.',
    icon: X,
    accent: 'hover:border-gray-500/60 hover:text-gray-200'
  },
  {
    id: 'youtube',
    label: 'YouTube',
    href: 'https://www.youtube.com/@B2Goalkeeping-by4co/featured',
    description: 'Deep dives, preparation routines, and keeper analysis videos.',
    icon: Youtube,
    accent: 'hover:border-red-500/60 hover:text-red-300'
  },
  {
    id: 'google',
    label: 'Google Profile',
    href: 'https://www.google.com/search?hl=en&sxsrf=AE3TifP24onLSPPKTIC2XZh5zMGSiyYy-A:1757177017774&kgmid=/g/11pz_6nzff&q=B2+GK+Gloves&shndl=30&shem=lcuae,lsptbl1,uaasie,shrtsdl&kgs=334c03a37bcf03b0',
    description: 'Check our latest reviews and store information in one place.',
    icon: Navigation,
    accent: 'hover:border-green-500/60 hover:text-green-300'
  }
];

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

        {elfsightEnabled ? (
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
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-8"
          >
            <p className="text-lg text-gray-200 mb-6">
              Follow B2 Goalkeeping across our social channels for giveaways, product drops, and elite training advice.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {SOCIAL_LINKS.map((social, idx) => (
                <motion.a
                  key={social.id}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                  viewport={{ once: true }}
                  className={`group flex items-start gap-4 rounded-xl border border-yellow-500/20 bg-gray-950/60 px-4 py-5 transition-all hover:border-yellow-500/40 hover:bg-gray-900/80 ${social.accent}`}
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-900/70 border border-yellow-500/20 text-yellow-400 group-hover:border-yellow-400/40 group-hover:text-yellow-300">
                    <social.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{social.label}</p>
                    <p className="text-sm text-gray-400 leading-relaxed">{social.description}</p>
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default SocialMedia;
