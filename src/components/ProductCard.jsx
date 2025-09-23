import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button.jsx';
import { useCart } from '@/context/CartContext.jsx';
import { useLocalization } from '@/context/LocalizationContext.jsx';
import { ShoppingCart, Eye, Minus, Plus } from 'lucide-react';

const ProductCard = ({ product }) => {
  const { addToCart, findCartItem, updateQuantity, getVariantQuantityInCart } = useCart();
  const { t } = useTranslation();
  const { formatPrice } = useLocalization();
  const [hoveredImageIndex, setHoveredImageIndex] = useState(0);
  const containerRef = useRef(null);
  const isVisibleRef = useRef(false);
  const autoplayIntervalRef = useRef(null);
  const AUTOPLAY_DELAY = 3000; // 3s per image

  // Removed autoplay behavior to prevent automatic image cycling and heavy page load.
  // Keep simple hover behavior: show second image on hover, revert on leave.
  const productImages = Array.isArray(product.images) ? product.images : [];

  useEffect(() => {
    // no-op: intentionally left blank to avoid autoplay
    return () => {};
  }, [productImages.length]);

  const defaultVariant = useMemo(() => {
    if (Array.isArray(product?.variants) && product.variants.length > 0) {
      return product.variants.find((variant) => variant.availableForSale) || product.variants[0];
    }

    if (product?.variantId) {
      return {
        id: product.variantId,
        title: product.title,
        availableForSale: product.availableForSale ?? true,
        price: product.price,
        currency: product.currency,
        compareAtPrice: product.compareAtPrice,
        image: product.images?.[0] ? {
          url: product.images[0].url,
          altText: product.images[0].altText,
        } : null,
        quantityAvailable: product.quantityAvailable ?? null,
      };
    }

    return null;
  }, [product]);

  const toPositiveInt = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) return null;
    return Math.floor(numeric);
  };

  const variantId = defaultVariant?.id;
  const cartItem = variantId ? findCartItem(variantId, []) : null;
  const cartQuantity = cartItem?.quantity ?? 0;
  const totalVariantInCart = variantId ? getVariantQuantityInCart(variantId) : 0;
  const variantMaxFromVariant = toPositiveInt(defaultVariant?.quantityAvailable);
  const effectiveMaxQuantity = typeof cartItem?.maxQuantity === 'number' ? cartItem.maxQuantity : variantMaxFromVariant;
  const remainingStock = typeof effectiveMaxQuantity === 'number'
    ? Math.max(0, effectiveMaxQuantity - totalVariantInCart)
    : null;
  const stockAllows = remainingStock === null || remainingStock > 0;
  const inCart = Boolean(cartItem);
  const variantAvailable = Boolean(defaultVariant) && (defaultVariant.availableForSale !== false || stockAllows);
  const canAddMore = variantAvailable && stockAllows;

  const handleMouseEnter = () => {
    if (productImages.length > 1) {
      setHoveredImageIndex(1);
    }
  };

  const handleMouseLeave = () => {
    setHoveredImageIndex(0);
  };

  const handleAddToCart = () => {
    if (!defaultVariant || !canAddMore) {
      return;
    }

    addToCart(product, defaultVariant, 1, []);
  };

  const handleIncrease = () => {
    if (!defaultVariant) return;

    if (inCart) {
      updateQuantity(defaultVariant.id, cartQuantity + 1, cartItem?.customAttributes || []);
    } else {
      handleAddToCart();
    }
  };

  const handleDecrease = () => {
    if (!defaultVariant || !inCart) return;

    updateQuantity(defaultVariant.id, cartQuantity - 1, cartItem?.customAttributes || []);
  };

  const hoverEffect = {
    scale: 1.05,
    boxShadow: '0 10px 30px rgba(250, 204, 21, 0.2)',
    y: -5,
    transition: { type: 'spring', stiffness: 300 },
  };


  const imageToShow = productImages[hoveredImageIndex] || productImages[0] || {};
  const mainImageUrl = imageToShow.url;

  const displayPrice = defaultVariant?.price ?? product.price;
  const displayCurrency = defaultVariant?.currency ?? product.currency;
  const compareAtPrice = defaultVariant?.compareAtPrice ?? product.compareAtPrice;
  const priceNumber = Number(displayPrice);
  const compareNumber = Number(compareAtPrice);
  const hasDiscount = Number.isFinite(priceNumber) && Number.isFinite(compareNumber) && compareNumber > priceNumber;
  const discountPercent = hasDiscount
    ? Math.max(1, Math.round(((compareNumber - priceNumber) / compareNumber) * 100))
    : null;

  const addDisabled = !defaultVariant || !canAddMore;
  const addLabel = (() => {
    if (!defaultVariant) return t('product.outOfStock', { defaultValue: 'Out of stock' });
    if (!canAddMore) return t('product.outOfStock', { defaultValue: 'Out of stock' });
    return t('Add to Cart');
  })();

  const plusDisabled = !defaultVariant || (remainingStock !== null && remainingStock <= 0);
  const minusDisabled = !inCart || cartQuantity <= 0;

  return (
    <motion.div
      whileHover={hoverEffect}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="product-card rounded-lg overflow-hidden group flex flex-col h-full"
    >
      <Link to={`/products/${product.handle}`} ref={containerRef} className="relative overflow-hidden block h-56">
        <img
          key={imageToShow.id || hoveredImageIndex}
          src={mainImageUrl}
          alt={imageToShow.altText || product.title}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          style={{ willChange: 'transform, opacity', transition: 'opacity 300ms ease-in-out' }}
        />
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
              {formatPrice(displayPrice ?? product.price ?? '0', displayCurrency)}
            </span>
            {compareAtPrice && (
              <span className="text-xs text-gray-500 line-through">
                {formatPrice(compareAtPrice, displayCurrency)}
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
          {inCart ? (
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
              onClick={handleAddToCart}
              disabled={addDisabled}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold flex items-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="h-4 w-4" />
              {addLabel}
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
};

export default memo(ProductCard);
