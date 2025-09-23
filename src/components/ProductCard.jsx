import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button.jsx';
import { useCart } from '@/context/CartContext.jsx';
import { useLocalization } from '@/context/LocalizationContext.jsx';
import { ShoppingCart, Eye } from 'lucide-react';

const ProductCard = ({ product }) => {
  const { addToCart, isItemInCart } = useCart();
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
      };
    }

    return null;
  }, [product]);

  const inCart = defaultVariant ? isItemInCart(defaultVariant.id) : false;

  const handleMouseEnter = () => {
    if (productImages.length > 1) {
      setHoveredImageIndex(1);
    }
  };

  const handleMouseLeave = () => {
    setHoveredImageIndex(0);
  };

  const handleAddToCart = () => {
    if (!defaultVariant || defaultVariant.availableForSale === false) {
      return;
    }

    addToCart(product, defaultVariant, 1, []);
  };

  const hoverEffect = {
    scale: 1.05,
    boxShadow: '0 10px 30px rgba(250, 204, 21, 0.2)',
    y: -5,
    transition: { type: 'spring', stiffness: 300 },
  };


  const imageToShow = productImages[hoveredImageIndex] || productImages[0] || {};
  const mainImageUrl = imageToShow.url;
  const previewImageUrl = imageToShow.thumbnailUrl || mainImageUrl;

  const displayPrice = defaultVariant?.price ?? product.price;
  const displayCurrency = defaultVariant?.currency ?? product.currency;
  const compareAtPrice = defaultVariant?.compareAtPrice ?? product.compareAtPrice;
  const addDisabled = !defaultVariant || defaultVariant.availableForSale === false || inCart;
  const addLabel = (() => {
    if (inCart) return t('In Cart');
    if (!defaultVariant || defaultVariant.availableForSale === false) return t('product.outOfStock', { defaultValue: 'Out of stock' });
    return t('Add to Cart');
  })();

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
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleAddToCart}
            disabled={addDisabled}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold flex items-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="h-4 w-4" />
            {addLabel}
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
};

export default memo(ProductCard);
