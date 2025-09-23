import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button.jsx';
import { useShopify } from '@/context/ShopifyContext.jsx';
import { useCart } from '@/context/CartContext.jsx';
import { Loader2, ShoppingCart, Eye } from 'lucide-react';
import AnimatedGradientText from '@/components/ui/animated-gradient-text.jsx';

const Products = () => {
  const { products, loading, error } = useShopify();
  const { addToCart, isItemInCart } = useCart();
  const { t } = useTranslation();

  const formatPrice = (price, currency = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(parseFloat(price));
  };

  const cardVariants = {
    offscreen: {
      y: 50,
      opacity: 0,
    },
    onscreen: (i) => ({
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        bounce: 0.4,
        duration: 0.8,
        delay: i * 0.1,
      },
    }),
  };

  const hoverEffect = {
    scale: 1.05,
    boxShadow: '0 10px 30px rgba(250, 204, 21, 0.2)',
    y: -5,
    transition: { type: 'spring', stiffness: 300 },
  };

  const selectDefaultVariant = (product) => {
    if (Array.isArray(product?.variants) && product.variants.length > 0) {
      return product.variants.find((variant) => variant.availableForSale) || product.variants[0];
    }

    if (product?.variantId) {
      return {
        id: product.variantId,
        availableForSale: product.availableForSale ?? true,
        price: product.price,
        currency: product.currency,
        compareAtPrice: product.compareAtPrice,
      };
    }

    return null;
  };

  return (
    <section id="produtos" className="py-20 bg-gray-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <AnimatedGradientText className="text-4xl md:text-5xl mb-6">
            {t('Our Products')}
          </AnimatedGradientText>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-gray-300 max-w-2xl mx-auto"
          >
            {t('High-performance goalkeeper gloves for all levels')}
          </motion.p>
        </div>

        {loading && (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="h-12 w-12 animate-spin text-yellow-500" />
          </div>
        )}

        {error && !loading && (
          <div className="text-center text-red-400 text-lg p-8 bg-red-900/20 rounded-lg">
            <p>Falha ao carregar os produtos.</p>
            <p className="text-sm text-red-300 mt-2">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
          {products.map((product, index) => {
            const defaultVariant = selectDefaultVariant(product);
            const inCart = defaultVariant ? isItemInCart(defaultVariant.id) : false;
            const price = defaultVariant?.price ?? product.price;
            const currency = defaultVariant?.currency ?? product.currency;
            const compareAtPrice = defaultVariant?.compareAtPrice ?? product.compareAtPrice;

            return (
            <motion.div
              key={product.id}
              custom={index}
              variants={cardVariants}
              initial="offscreen"
              whileInView="onscreen"
              whileHover={hoverEffect}
              viewport={{ once: true, amount: 0.3 }}
              className="product-card rounded-lg overflow-hidden group flex flex-col w-full max-w-sm"
            >
              <Link to={`/products/${product.handle}`} className="relative overflow-hidden block">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.imageAlt}
                    loading="lazy"
                    className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-56 bg-gray-800 flex items-center justify-center">
                    <span className="text-gray-400">Sem imagem</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>

              <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-yellow-400 transition-colors">
                  <Link to={`/products/${product.handle}`}>{product.title}</Link>
                </h3>
                
                <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-grow">
                  {product.description || 'Luva de goleiro profissional'}
                </p>

                <div className="flex items-center justify-between mb-4 mt-auto">
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-yellow-400">
                      {formatPrice(price ?? product.price ?? '0', currency)}
                    </span>
                    {compareAtPrice && (
                      <span className="text-xs text-gray-500 line-through">
                        {formatPrice(compareAtPrice, currency)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      if (!defaultVariant || defaultVariant.availableForSale === false) {
                        return;
                      }
                      addToCart(product, defaultVariant, 1, []);
                    }}
                    disabled={!defaultVariant || defaultVariant.availableForSale === false || inCart}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold flex items-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {inCart
                      ? t('In Cart')
                      : (!defaultVariant || defaultVariant.availableForSale === false)
                        ? t('product.outOfStock', { defaultValue: 'Out of stock' })
                        : t('Add to Cart')}
                  </Button>
                  <Link to={`/products/${product.handle}`} className="flex-shrink-0">
                    <Button variant="outline" size="icon" className="border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
            );
          })}
        </div>

        {products.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Nenhum produto encontrado.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Products;
