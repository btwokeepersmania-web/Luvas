import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/context/CartContext.jsx';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button.jsx';
import { X, ShoppingCart } from 'lucide-react';
import ProductCard from '@/components/ProductCard.jsx';

const SuggestionsModal = () => {
  const { 
    isSuggestionsModalOpen, 
    closeSuggestionsModal, 
    suggestedProducts,
    setIsCartOpen
  } = useCart();
  const { t } = useTranslation();

  const backdropVariants = {
    visible: { opacity: 1 },
    hidden: { opacity: 0 },
  };

  const modalVariants = {
    visible: { opacity: 1, y: 0, scale: 1 },
    hidden: { opacity: 0, y: 50, scale: 0.95 },
  };

  const handleViewCart = () => {
    closeSuggestionsModal();
    setIsCartOpen(true);
  };

  return (
    <AnimatePresence>
      {isSuggestionsModalOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={closeSuggestionsModal}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        >
          <motion.div
            id="you-may-also-like-modal"
            variants={modalVariants}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl bg-gray-900 border border-yellow-500/20 rounded-xl flex flex-col overflow-hidden max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-6 border-b border-yellow-500/20 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold gradient-text">{t('suggestions.title')}</h2>
                  <p className="text-gray-400">{t('suggestions.subtitle')}</p>
                </div>
                {/* 'Read Instruction' CTA removed to prevent unwanted navigation/popups */}
              </div>
              <Button variant="ghost" size="icon" onClick={closeSuggestionsModal}>
                <X className="h-6 w-6 text-gray-400 hover:text-white" />
              </Button>
            </div>

            <div className="flex-grow overflow-y-auto p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestedProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-yellow-500/20 flex flex-col sm:flex-row items-center justify-end gap-4 flex-shrink-0">
              <Button variant="outline" onClick={closeSuggestionsModal} className="w-full sm:w-auto border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10">
                {t('suggestions.continueShopping')}
              </Button>
              <Button onClick={handleViewCart} className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                <ShoppingCart className="mr-2 h-4 w-4" />
                {t('suggestions.viewCart')}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuggestionsModal;
