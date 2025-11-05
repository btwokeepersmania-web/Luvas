import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import ReviewButton from '@/components/ReviewButton.jsx';
import { useTranslation } from 'react-i18next';
import { loadElfsightPlatform } from '@/lib/elfsight.js';
import { Button } from '@/components/ui/button.jsx';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

const FALLBACK_REVIEWS = [
  {
    id: 'paul-t',
    name: 'Paul T.',
    date: '5 months ago',
    source: 'Google Reviews',
    text: 'These gloves are awesome – the grip, fit, price, and customer service are second to none. I will be back for more when these wear out!'
  },
  {
    id: 'michael-f',
    name: 'Michael F.',
    date: '2 years ago',
    source: 'Trustpilot',
    text: 'Friendly service and the products are even better than advertised. Better quality, better prices, and better customer care than the mainstream brands.'
  },
  {
    id: 'evert-v',
    name: 'Evert V.',
    date: 'January 29, 2021',
    source: 'Facebook',
    text: 'Lovely prototype gloves with tacky latex and a hybrid negative cut that feels like a second skin. B2 are making great strides in the goalkeeping world!'
  },
  {
    id: 'm32-v',
    name: 'M32 V.',
    date: '2 years ago',
    source: 'Google Reviews',
    text: 'Luva top! Ótima construção, grip excelente no seco e no molhado, ótimo conforto e durabilidade. Só não dou 10 estrelas porque aqui só pode 5!'
  },
  {
    id: 'mitch-e',
    name: 'Mitch E.',
    date: '1 year ago',
    source: 'Google Reviews',
    text: 'Had two pairs of these gloves. Price is amazing and the quality is top tier. Fantastic value for money.'
  },
  {
    id: 'kate-w',
    name: 'Kate W.',
    date: 'March 19, 2024',
    source: 'Google Reviews',
    text: 'Really helpful and excellent communication after I placed my order. Could not ask for better support.'
  },
  {
    id: 'kristopher-w',
    name: 'Kristopher W.',
    date: 'April 22, 2024',
    source: 'Google Reviews',
    text: 'Great delivery and the gloves are true to size. Fantastic quality across the board.'
  },
  {
    id: 'ashley-b',
    name: 'Ashley B.',
    date: 'November 9, 2024',
    source: 'Facebook',
    text: 'Tried the gloves today for the first time. Brilliant design, super comfortable, and the grip stayed outstanding even in tough conditions.'
  },
  {
    id: 'daniel-r',
    name: 'Daniel R.',
    date: 'September 20, 2024',
    source: 'Google Reviews',
    text: 'Best gloves on the market with mega sticky latex and superb wrist protection. I buy several pairs a year for my academy keeper.'
  },
  {
    id: 'jennifer-l',
    name: 'Jennifer L.',
    date: 'January 27, 2022',
    source: 'Trustpilot',
    text: 'Since buying these gloves I have never wanted anything else. Amazing product, amazing service, and Bruno truly looks after his customers.'
  },
  {
    id: 'mark',
    name: 'Mark',
    date: 'October 30, 2024',
    source: 'Trustpilot',
    text: 'Bought these after being disappointed by a big brand. The quality and fit are easily better — I’m very happy and will purchase again.'
  },
  {
    id: 'alasdair-r',
    name: 'Alasdair R.',
    date: 'May 19, 2024',
    source: 'Google Reviews',
    text: 'First class service and fast shipping. Exactly what I was looking for and highly recommended.'
  }
];

const Reviews = () => {
  const { t } = useTranslation();
  const elfsightEnabled = import.meta.env.VITE_ELFSIGHT_ENABLE === 'true';
  const reviewCount = FALLBACK_REVIEWS.length;
  const initialVisible = Math.min(reviewCount, 1);
  const [visibleCount, setVisibleCount] = useState(initialVisible);
  const [displayIndex, setDisplayIndex] = useState(initialVisible);
  const [instantTransition, setInstantTransition] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimeoutRef = useRef(null);

  const clearPauseTimeout = () => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
  };

  const scheduleResume = (delay = 6000) => {
    if (reviewCount <= visibleCount) {
      setIsPaused(false);
      return;
    }
    clearPauseTimeout();
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
      pauseTimeoutRef.current = null;
    }, delay);
  };

  const slides = useMemo(() => {
    if (reviewCount === 0) return [];
    const head = FALLBACK_REVIEWS.slice(-visibleCount);
    const tail = FALLBACK_REVIEWS.slice(0, visibleCount);
    return [...head, ...FALLBACK_REVIEWS, ...tail];
  }, [visibleCount, reviewCount]);

  useEffect(() => {
    if (!elfsightEnabled) return undefined;

    let cancelled = false;
    loadElfsightPlatform().catch((error) => {
      if (!cancelled) {
        console.warn('Failed to initialise Elfsight reviews widget', error);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [elfsightEnabled]);

  useEffect(() => {
    const updateVisibleCount = () => {
      if (typeof window === 'undefined') return;
      let count = Math.min(reviewCount, 1);
      const width = window.innerWidth;
      if (width >= 1536) count = Math.min(reviewCount, 6);
      else if (width >= 1280) count = Math.min(reviewCount, 4);
      else if (width >= 1024) count = Math.min(reviewCount, 3);
      else if (width >= 768) count = Math.min(reviewCount, 2);
      setVisibleCount(count || 1);
    };
    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount);
    return () => window.removeEventListener('resize', updateVisibleCount);
  }, [reviewCount]);

useEffect(() => {
  setInstantTransition(true);
  setDisplayIndex(visibleCount);
  const timeout = setTimeout(() => setInstantTransition(false), 0);
  return () => clearTimeout(timeout);
}, [visibleCount]);

  useEffect(() => () => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (elfsightEnabled || reviewCount <= visibleCount || isPaused) return undefined;
    const timer = setTimeout(() => {
      setInstantTransition(false);
      setDisplayIndex((prev) => prev + 1);
    }, 6000);
    return () => clearTimeout(timer);
  }, [displayIndex, elfsightEnabled, reviewCount, visibleCount, isPaused]);

  useEffect(() => {
    const upperBound = visibleCount + reviewCount;
    if (displayIndex >= upperBound) {
      setInstantTransition(true);
      setDisplayIndex(visibleCount);
      const timeout = setTimeout(() => setInstantTransition(false), 20);
      return () => clearTimeout(timeout);
    }
    if (displayIndex < visibleCount) {
      setInstantTransition(true);
      setDisplayIndex(visibleCount + reviewCount - 1);
      const timeout = setTimeout(() => setInstantTransition(false), 20);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [displayIndex, visibleCount, reviewCount]);

  const logicalIndex = ((displayIndex - visibleCount) % reviewCount + reviewCount) % reviewCount;

  const goToLogicalIndex = (index) => {
    setInstantTransition(false);
    setIsPaused(true);
    clearPauseTimeout();
    setDisplayIndex(index + visibleCount);
    scheduleResume();
  };

  const handlePrev = () => {
    setInstantTransition(false);
    setIsPaused(true);
    clearPauseTimeout();
    setDisplayIndex((prev) => prev - 1);
    scheduleResume();
  };

  const handleNext = () => {
    setInstantTransition(false);
    setIsPaused(true);
    clearPauseTimeout();
    setDisplayIndex((prev) => prev + 1);
    scheduleResume();
  };

  const handlePause = () => {
    setIsPaused(true);
    clearPauseTimeout();
  };

  const handleResume = () => {
    scheduleResume();
  };

  return (
    <section id="reviews" className="py-20 bg-gray-950 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            {t('reviews.elfsightTitle')}
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {t('reviews.elfsightDescription')}
          </p>
        </motion.div>
      </div>

      {/* Elfsight All-in-One Reviews Widget: load only in production to avoid dev preview fetch errors */}
      <div className="container mx-auto px-4 my-16">
        {elfsightEnabled ? (
          <div id="elfsight-reviews" className="elfsight-app-334fbb31-c526-42e1-af48-eb22eb6e4f23" data-elfsight-app-lazy />
        ) : (
          <div
            className="relative"
            onMouseEnter={handlePause}
            onMouseLeave={handleResume}
            onTouchStart={handlePause}
            onTouchEnd={handleResume}
            onTouchCancel={handleResume}
          >
            <div className="overflow-hidden">
              <motion.div
                key={visibleCount}
                className="flex"
                animate={{ x: `-${(displayIndex * 100) / visibleCount}%` }}
                transition={
                  instantTransition
                    ? { duration: 0 }
                    : { duration: 0.8, ease: 'easeInOut' }
                }
                style={{ gap: '1.25rem' }}
              >
                {slides.map((review, idx) => (
                  <div
                    key={`${review.id}-${idx}`}
                    className="relative flex h-full flex-col rounded-2xl border border-yellow-500/20 bg-gray-900/70 p-5 shadow-[0_0_20px_rgba(234,179,8,0.05)] transition-transform hover:-translate-y-1 hover:border-yellow-500/40"
                    style={{ flex: `0 0 ${100 / visibleCount}%` }}
                  >
                    <div className="flex items-center gap-1 mb-3">
                      {Array.from({ length: 5 }).map((_, starIdx) => (
                        <Star key={starIdx} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-200 leading-relaxed flex-1">
                      “{review.text}”
                    </p>
                    <div className="mt-4 pt-3 border-t border-yellow-500/10 text-xs text-gray-400">
                      <p className="font-semibold text-white text-sm">{review.name}</p>
                      <p>{review.date}</p>
                      <p className="italic">{review.source}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            {reviewCount > visibleCount && (
              <>
                <div className="flex items-center justify-between mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrev}
                    className="border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    <span className="sr-only">Previous reviews</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleNext}
                    className="border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10"
                  >
                    <span className="sr-only">Next reviews</span>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex justify-center gap-2 mt-4 flex-wrap">
                  {FALLBACK_REVIEWS.map((review, idx) => (
                    <button
                      type="button"
                      key={review.id}
                      onClick={() => goToLogicalIndex(idx)}
                      className={`h-2.5 rounded-full transition-all ${
                        idx === logicalIndex ? 'bg-yellow-400 w-6' : 'bg-gray-600 hover:bg-gray-500 w-2.5'
                      }`}
                      aria-label={`Go to reviews starting with ${review.name}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="text-center mt-16">
        <ReviewButton className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-4 text-lg neon-glow" />
      </div>
    </section>
  );
};

export default Reviews;
