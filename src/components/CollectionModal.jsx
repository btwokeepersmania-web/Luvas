import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShopify } from '@/context/ShopifyContext.jsx';
import { useCart } from '@/context/CartContext.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Loader2, X, ShoppingCart } from 'lucide-react';

const CollectionModal = ({ collection, isOpen, onClose }) => {
  const { fetchCollectionProducts } = useShopify();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const loadProducts = async () => {
        setLoading(true);
        setError(null);
        try {
          const collectionProducts = await fetchCollectionProducts(collection.id);
          setProducts(collectionProducts);
        } catch (err) {
          setError('Não foi possível carregar os produtos da coleção.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      loadProducts();
    }
  }, [isOpen, collection.id, fetchCollectionProducts]);

  const formatPrice = (price, currency = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(parseFloat(price));
  };
  
  const backdropVariants = {
    visible: { opacity: 1 },
    hidden: { opacity: 0 },
  };

  const modalVariants = {
    visible: { opacity: 1, y: 0, scale: 1 },
    hidden: { opacity: 0, y: 50, scale: 0.95 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            variants={modalVariants}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl h-[90vh] bg-gray-900 border border-green-500/20 rounded-xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-green-500/20 flex-shrink-0">
              <h2 className="text-2xl font-bold gradient-text">{collection.title}</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-6 w-6 text-gray-400 hover:text-white" />
              </Button>
            </div>

            <div className="flex-grow overflow-y-auto p-6">
              {loading && (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-12 w-12 animate-spin text-green-500" />
                </div>
              )}
              
              {error && (
                <div className="text-center text-red-400 text-lg p-8">
                  <p>{error}</p>
                </div>
              )}

              {!loading && !error && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.length > 0 ? (
                    products.map((product) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="product-card rounded-lg overflow-hidden group flex flex-col"
                      >
                         <div className="relative overflow-hidden">
                            <img src={product.image} alt={product.imageAlt} className="w-full h-48 object-cover"/>
                         </div>
                         <div className="p-4 flex flex-col flex-grow">
                           <h3 className="text-md font-semibold mb-2 text-white group-hover:text-green-400">{product.title}</h3>
                           <div className="mt-auto">
                              <p className="text-lg font-bold text-green-400 mb-4">{formatPrice(product.price, product.currency)}</p>
                              <Button
                                onClick={() => {
                                  addToCart(product);
                                  onClose();
                                }}
                                className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold flex items-center gap-2"
                              >
                                <ShoppingCart className="h-4 w-4" />
                                Adicionar
                              </Button>
                           </div>
                         </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <p className="text-gray-400">Nenhum produto nesta coleção ainda.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CollectionModal;