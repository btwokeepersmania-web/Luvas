import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button.jsx';
import { useShopify } from '@/context/ShopifyContext.jsx';
import { useCart } from '@/context/CartContext.jsx';
import { Loader2, ShoppingCart, Eye, Minus, Plus } from 'lucide-react';
import AnimatedGradientText from '@/components/ui/animated-gradient-text.jsx';

const Products = () => {
  const { products, loading, error } = useShopify();
  const { addToCart, findCartItem, updateQuantity, getVariantQuantityInCart } = useCart();
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

  const toPositiveInt = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) return null;
    return Math.floor(numeric);
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
            const variantId = defaultVariant?.id;
            const cartItem = variantId ? findCartItem(variantId, []) : null;
            const cartQuantity = cartItem?.quantity ?? 0;
            const totalVariantInCart = variantId ? getVariantQuantityInCart(variantId) : 0;
            const variantMax = toPositiveInt(defaultVariant?.quantityAvailable);
            const effectiveMax = typeof cartItem?.maxQuantity === 'number' ? cartItem.maxQuantity : variantMax;
            const remainingStock = typeof effectiveMax === 'number'
              ? Math.max(0, effectiveMax - totalVariantInCart)
              : null;
            const stockAllows = remainingStock === null || remainingStock > 0;
            const variantAvailable = Boolean(defaultVariant) && (defaultVariant.availableForSale !== false || stockAllows);
            const price = defaultVariant?.price ?? product.price;
            const currency = defaultVariant?.currency ?? product.currency;
            const compareAtPrice = defaultVariant?.compareAtPrice ?? product.compareAtPrice;
            const priceNumber = Number(price);
            const compareNumber = Number(compareAtPrice);
            const hasDiscount = Number.isFinite(priceNumber) && Number.isFinite(compareNumber) && compareNumber > priceNumber;
            const discountPercent = hasDiscount
              ? Math.max(1, Math.round(((compareNumber - priceNumber) / compareNumber) * 100))
              : null;
            const canAddMore = variantAvailable && stockAllows;
            const addDisabled = !defaultVariant || !canAddMore;
            const plusDisabled = !defaultVariant || (remainingStock !== null && remainingStock <= 0);
            const minusDisabled = !cartItem || cartQuantity <= 0;

            const handleAdd = () => {
              if (!defaultVariant || !canAddMore) return;
              addToCart(product, defaultVariant, 1, []);
            };

            const handleIncrease = () => {
              if (!defaultVariant) return;
              if (cartItem) {
                updateQuantity(defaultVariant.id, cartQuantity + 1, cartItem.customAttributes || []);
              } else {
                handleAdd();
              }
            };

            const handleDecrease = () => {
              if (!defaultVariant || !cartItem) return;
              updateQuantity(defaultVariant.id, cartQuantity - 1, cartItem.customAttributes || []);
            };

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
                {hasDiscount && discountPercent && (
                  <span className="absolute top-3 left-3 z-10 bg-red-500 text-black text-xs font-bold px-2 py-1 rounded">
                    -{discountPercent}%
                  </span>
                )}
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
                    {hasDiscount && discountPercent && (
                      <span className="text-xs text-green-400 font-semibold">
                        {t('product.savePercent', { defaultValue: 'Save {{percent}}%', percent: discountPercent })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {cartItem ? (
                    <div className="flex items-center justify-between gap-2 w-full rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2">
                      <span className="flex items-center gap-2 text-sm font-semibold text-yellow-400">
                        <ShoppingCart className="h-4 w-4" />
                        {t('In Cart')}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleDecrease}
                          disabled={minusDisabled}
                          className="h-8 w-8 border-yellow-500/40 text-yellow-400 hover:bg-yellow-500 hover:text-black"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-white font-semibold min-w-[2rem] text-center">
                          {cartQuantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleIncrease}
                          disabled={plusDisabled}
                          className="h-8 w-8 border-yellow-500/40 text-yellow-400 hover:bg-yellow-500 hover:text-black disabled:opacity-60"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={handleAdd}
                      disabled={addDisabled}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold flex items-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {addDisabled
                        ? t('product.outOfStock', { defaultValue: 'Out of stock' })
                        : t('Add to Cart')}
                    </Button>
                  )}
                  <Link to={`/products/${product.handle}`} className="flex-shrink-0">
                    <Button variant="outline" size="icon" className="border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {typeof remainingStock === 'number' && (
                  <p className="text-xs text-gray-400 mt-2">
                    {remainingStock > 0
                      ? t('product.remainingStock', { defaultValue: '{{count}} item(s) left', count: remainingStock })
                      : t('product.noMoreStock', { defaultValue: 'No additional stock available' })}
                  </p>
                )}
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
