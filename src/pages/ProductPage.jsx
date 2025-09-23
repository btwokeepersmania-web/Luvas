import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useShopify } from '@/context/ShopifyContext.jsx';
import { useCart } from '@/context/CartContext.jsx';
import { useLocalization } from '@/context/LocalizationContext.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Loader2, ShoppingCart, ChevronLeft, ChevronRight, Minus, Plus, X } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { cn } from '@/lib/utils.js';
import { useTranslation } from 'react-i18next';
import YouMayAlsoLike from '@/components/YouMayAlsoLike.jsx';

const normalizeValue = (value) => String(value ?? '').trim().toLowerCase();

const toPositiveInt = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return Math.floor(numeric);
};

const ProductPage = () => {
  const { handle } = useParams();
  const { fetchProductByHandle } = useShopify();
  const { addToCart, findCartItem, updateQuantity, cartItems } = useCart();
  const { formatPrice, country, language } = useLocalization();
  const { t } = useTranslation();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [gloveId, setGloveId] = useState('');
  const [number, setNumber] = useState('');

  useEffect(() => {
    if (!country || !language) {
      return;
    }
    const getProductData = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedProduct = await fetchProductByHandle(handle);
        if (!fetchedProduct) {
          setError(t('product.notFound'));
          setProduct(null);
          return;
        }

        const initialOptions = {};
        if (Array.isArray(fetchedProduct.variants) && fetchedProduct.variants.length > 0) {
          const firstAvailableVariant = fetchedProduct.variants.find((variant) => variant.availableForSale) || fetchedProduct.variants[0];
          if (firstAvailableVariant) {
            firstAvailableVariant.selectedOptions.forEach((option) => {
              initialOptions[option.name] = option.value;
            });
          }
        }

        (fetchedProduct.options || []).forEach((option) => {
          if (!initialOptions[option.name]) {
            initialOptions[option.name] = option.values?.[0];
          }
        });

        setProduct(fetchedProduct);
        setSelectedOptions(initialOptions);
        setSelectedImageIndex(0);
        setQuantity(1);
      } catch (err) {
        console.error('Failed to load product', err);
        setError(t('product.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    getProductData();
  }, [handle, fetchProductByHandle, t, country, language]);

  const images = product?.images ?? [];
  const options = product?.options ?? [];
  const variants = product?.variants ?? [];

  useEffect(() => {
    if (!images.length) return undefined;
    const preloaders = images.map((image) => {
      if (!image?.url) return null;
      const img = new Image();
      img.src = image.url;
      return img;
    });
    return () => {
      preloaders.forEach((img) => {
        if (img) {
          img.onload = null;
          img.onerror = null;
        }
      });
    };
  }, [images]);

  const availability = useMemo(() => {
    if (!variants.length || !options.length) {
      return {
        optionOrder: [],
        variantMap: new Map(),
        optionValueInfo: new Map(),
        firstAvailableByOption: new Map(),
      };
    }

    const optionOrder = options.map((option) => option.name);
    const variantMap = new Map();
    const optionValueInfo = new Map();
    const firstAvailableByOption = new Map();

    variants.forEach((variant) => {
      const normalizedSelection = {};

      variant.selectedOptions.forEach((option) => {
        const nameNorm = normalizeValue(option.name);
        const valueNorm = normalizeValue(option.value);
        normalizedSelection[nameNorm] = option.value;

        if (!optionValueInfo.has(nameNorm)) {
          optionValueInfo.set(nameNorm, new Map());
        }
        if (!optionValueInfo.get(nameNorm).has(valueNorm)) {
          optionValueInfo.get(nameNorm).set(valueNorm, { exists: true, anyAvailable: false });
        }
        if (variant.availableForSale) {
          const info = optionValueInfo.get(nameNorm).get(valueNorm);
          info.anyAvailable = true;
          const key = `${nameNorm}|${valueNorm}`;
          if (!firstAvailableByOption.has(key)) {
            firstAvailableByOption.set(key, variant);
          }
        }
      });

      const key = optionOrder
        .map((name) => normalizeValue(normalizedSelection[normalizeValue(name)]))
        .join('|');

      variantMap.set(key, variant);
    });

    return {
      optionOrder,
      variantMap,
      optionValueInfo,
      firstAvailableByOption,
    };
  }, [variants, options]);

  const { optionOrder, variantMap, optionValueInfo, firstAvailableByOption } = availability;

  const buildVariantKey = useCallback(
    (selections) => {
      if (!optionOrder.length) return '';
      return optionOrder.map((name) => normalizeValue(selections?.[name])).join('|');
    },
    [optionOrder]
  );

  const selectedVariant = useMemo(() => {
    if (!variantMap.size) return null;
    const key = buildVariantKey(selectedOptions);
    return variantMap.get(key) || null;
  }, [variantMap, buildVariantKey, selectedOptions]);

  useEffect(() => {
    if (cartItem) return;
    if (maxQuantity !== null) {
      if (maxQuantity > 0 && quantity > maxQuantity) {
        setQuantity(maxQuantity);
      }
      if (maxQuantity === 0 && quantity !== 1) {
        setQuantity(1);
      }
    } else if (quantity < 1) {
      setQuantity(1);
    }
  }, [cartItem, maxQuantity, quantity]);

  useEffect(() => {
    if (cartItem) {
      setQuantity(cartItem.quantity || 1);
    }
  }, [cartItem]);

  const imageIndexMap = useMemo(() => {
    const map = new Map();
    images.forEach((image, index) => {
      map.set(image.id, index);
    });
    return map;
  }, [images]);

  useEffect(() => {
    if (!selectedVariant?.image?.id) return;
    const newIndex = imageIndexMap.get(selectedVariant.image.id);
    if (typeof newIndex === 'number') {
      setSelectedImageIndex((prev) => (prev === newIndex ? prev : newIndex));
    }
  }, [selectedVariant, imageIndexMap]);

  const isVariantCombinationAvailable = useCallback(
    (optionName, value) => {
      if (!variantMap.size) return false;
      const tentativeSelections = { ...selectedOptions, [optionName]: value };
      const variant = variantMap.get(buildVariantKey(tentativeSelections));
      return variant ? Boolean(variant.availableForSale) : false;
    },
    [variantMap, selectedOptions, buildVariantKey]
  );

  const handleOptionChange = useCallback(
    (optionName, value) => {
      setSelectedOptions((prev) => {
        const next = { ...prev, [optionName]: value };
        const exactVariant = variantMap.get(buildVariantKey(next));
        if (exactVariant?.availableForSale) {
          return next;
        }

        const fallbackVariant = firstAvailableByOption.get(`${normalizeValue(optionName)}|${normalizeValue(value)}`);
        if (fallbackVariant) {
          const mapped = {};
          fallbackVariant.selectedOptions.forEach((opt) => {
            mapped[opt.name] = opt.value;
          });
          return mapped;
        }

        return next;
      });
    },
    [variantMap, buildVariantKey, firstAvailableByOption]
  );

  const hasCustomizationOptions = useMemo(() => {
    return product?.metafields?.some(
      (metafield) => metafield && metafield.namespace === 'optionize' && metafield.key === 'product_options'
    );
  }, [product]);

  const customizationFields = useMemo(() => {
    if (!hasCustomizationOptions) return [];
    try {
      const metafield = product.metafields.find(
        (field) => field && field.namespace === 'optionize' && field.key === 'product_options'
      );
      if (!metafield?.value) return [];
      const parsed = JSON.parse(metafield.value);
      return Array.isArray(parsed?.fields) ? parsed.fields : [];
    } catch (err) {
      console.error('Could not parse Optionize metafields', err);
      return [];
    }
  }, [product, hasCustomizationOptions]);

  const personalizationLabels = useMemo(() => {
    const nameLabel =
      customizationFields.find((field) => field.label.toLowerCase().includes('name'))?.label || 'Personalized Name';
    const numberLabel =
      customizationFields.find((field) => field.label.toLowerCase().includes('number'))?.label || 'Your Number';
    return { nameLabel, numberLabel };
  }, [customizationFields]);

  const currentCustomAttributes = useMemo(() => {
    const attributes = [];
    if (gloveId) {
      attributes.push({ key: personalizationLabels.nameLabel, value: gloveId });
    }
    if (number) {
      attributes.push({ key: personalizationLabels.numberLabel, value: number });
    }
    return attributes;
  }, [gloveId, number, personalizationLabels]);

  const cartItem = useMemo(() => {
    if (!selectedVariant) return null;
    return findCartItem(selectedVariant.id, currentCustomAttributes);
  }, [selectedVariant, currentCustomAttributes, findCartItem]);

  const cartItemQuantity = cartItem?.quantity ?? 0;
  const normalizedSelectedVariantId = selectedVariant ? String(selectedVariant.id) : null;

  const totalVariantInCart = useMemo(() => {
    if (!normalizedSelectedVariantId) return 0;
    return cartItems.reduce((total, item) => (
      String(item.variantId) === normalizedSelectedVariantId ? total + item.quantity : total
    ), 0);
  }, [cartItems, normalizedSelectedVariantId]);

  const variantQuantityAvailable = toPositiveInt(selectedVariant?.quantityAvailable);
  const otherVariantQuantity = Math.max(0, totalVariantInCart - cartItemQuantity);
  const effectiveMaxQuantity = variantQuantityAvailable !== null
    ? Math.max(0, variantQuantityAvailable - otherVariantQuantity)
    : null;
  const overallVariantRemaining = variantQuantityAvailable !== null
    ? Math.max(0, variantQuantityAvailable - totalVariantInCart)
    : null;
  const maxQuantity = effectiveMaxQuantity;
  const stockAllows = maxQuantity === null || maxQuantity > 0 || Boolean(cartItem);
  const variantAvailable = Boolean(selectedVariant) && (selectedVariant.availableForSale !== false || stockAllows);

  const displayQuantity = cartItem ? cartItem.quantity : quantity;
  const increaseDisabled = maxQuantity !== null && displayQuantity >= maxQuantity;
  const decreaseDisabled = cartItem ? cartItem.quantity <= 0 : quantity <= 1;
  const addButtonDisabled = !variantAvailable;

  const primaryPrice = selectedVariant?.price ?? product?.price;
  const primaryCurrency = selectedVariant?.currency ?? product?.currency;
  const comparePrice = selectedVariant?.compareAtPrice ?? product?.compareAtPrice;
  const priceNumber = Number(primaryPrice);
  const compareNumber = Number(comparePrice);
  const hasDiscount = Number.isFinite(priceNumber) && Number.isFinite(compareNumber) && compareNumber > priceNumber;
  const discountPercent = hasDiscount
    ? Math.max(1, Math.round(((compareNumber - priceNumber) / compareNumber) * 100))
    : null;

  const incrementQuantity = useCallback(() => {
    if (!selectedVariant) return;

    if (cartItem) {
      updateQuantity(selectedVariant.id, cartItem.quantity + 1, currentCustomAttributes);
      return;
    }

    setQuantity((prev) => {
      if (maxQuantity !== null) {
        if (maxQuantity <= 0) {
          return 1;
        }
        return Math.min(prev + 1, maxQuantity);
      }
      return prev + 1;
    });
  }, [selectedVariant, cartItem, updateQuantity, currentCustomAttributes, maxQuantity]);

  const decrementQuantity = useCallback(() => {
    if (!selectedVariant) return;

    if (cartItem) {
      updateQuantity(selectedVariant.id, cartItem.quantity - 1, currentCustomAttributes);
      return;
    }

    setQuantity((prev) => Math.max(1, prev - 1));
  }, [selectedVariant, cartItem, updateQuantity, currentCustomAttributes]);

  const handleAddToCart = useCallback(() => {
    if (!selectedVariant || !variantAvailable) return;

    if (cartItem) {
      updateQuantity(selectedVariant.id, displayQuantity, currentCustomAttributes);
      return;
    }

    if (maxQuantity !== null && maxQuantity <= 0) {
      return;
    }

    addToCart(product, selectedVariant, quantity, currentCustomAttributes);
  }, [addToCart, cartItem, currentCustomAttributes, displayQuantity, maxQuantity, product, quantity, selectedVariant, updateQuantity, variantAvailable]);

  const handleNextImage = useCallback(() => {
    if (!images.length) return;
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrevImage = useCallback(() => {
    if (!images.length) return;
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <Loader2 className="h-16 w-16 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-center px-4">
        <h1 className="text-3xl font-bold text-red-500 mb-4">{error}</h1>
        <Link to="/"><Button className="bg-yellow-500 hover:bg-yellow-600 text-black">{t('Back to Home')}</Button></Link>
      </div>
    );
  }

  if (!product) return null;

  const hasImages = images.length > 0;
  const currentImage = hasImages ? images[Math.min(selectedImageIndex, images.length - 1)] : null;
  const currentImageUrl = currentImage?.url;

  return (
    <>
      <Helmet>
        <title>{`${product.title} - B2 Goalkeeping`}</title>
        <meta name="description" content={product.description} />
        <meta property="og:title" content={`${product.title} - B2 Goalkeeping`} />
        <meta property="og:description" content={product.description} />
        <meta property="og:image" content={currentImage?.url} />
      </Helmet>
      <div className="container mx-auto px-4 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16"
        >
          <div className="flex flex-col gap-4 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-square w-full max-w-lg overflow-hidden rounded-lg border border-yellow-500/20"
            >
              {hasImages ? (
                <img
                  key={currentImage?.id ?? selectedImageIndex}
                  src={currentImageUrl}
                  alt={currentImage?.altText || product.title}
                  className="w-full h-full object-cover product-main-image transition-opacity duration-300 ease-in-out"
                  loading={selectedImageIndex === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  style={{ opacity: 1 }}
                />
              ) : (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-500 text-sm">
                  {t('product.noImageAvailable') || 'Image not available'}
                </div>
              )}

              {hasImages && images.length > 1 && (
                <>
                  <Button
                    onClick={handlePrevImage}
                    size="icon"
                    variant="ghost"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white"
                  >
                    <ChevronLeft />
                  </Button>
                  <Button
                    onClick={handleNextImage}
                    size="icon"
                    variant="ghost"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white"
                  >
                    <ChevronRight />
                  </Button>
                </>
              )}
            </motion.div>

            {hasImages && (
              <div className="grid grid-cols-5 gap-2 w-full max-w-lg">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      'aspect-square cursor-pointer rounded-md overflow-hidden border-2 transition-all',
                      selectedImageIndex === index
                        ? 'border-yellow-500'
                        : 'border-transparent hover:border-yellow-500/50'
                    )}
                  >
                    <img
                      src={image.thumbnailUrl || image.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <motion.h1
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-4xl md:text-5xl font-bold mb-2 gradient-text"
            >
              {product.title}
            </motion.h1>
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-wrap items-center gap-4 mb-4"
            >
              <span className="text-4xl font-bold text-yellow-400">
                {formatPrice(primaryPrice, primaryCurrency)}
              </span>
              {comparePrice && (
                <span className="text-xl text-gray-500 line-through">
                  {formatPrice(comparePrice, primaryCurrency)}
                </span>
              )}
              {hasDiscount && discountPercent && (
                <span className="px-2 py-1 text-xs font-semibold uppercase rounded bg-red-500/90 text-black tracking-wide">
                  {t('product.savePercent', { defaultValue: 'Save {{percent}}%', percent: discountPercent })}
                </span>
              )}
            </motion.div>
            <p className="text-sm text-gray-400 mb-6">{t('product.taxAndShipping')}</p>

            <div className="space-y-6 mb-8">
              {options.map((option) => {
                const optionNameNorm = normalizeValue(option.name);
                const optionValuesInfo = optionValueInfo.get(optionNameNorm);

                return (
                  <div key={option.id}>
                    <span className="text-lg font-semibold text-white mb-3 block">{option.name}</span>
                    <div className="flex flex-wrap gap-3">
                      {option.values.map((value) => {
                        const valueNorm = normalizeValue(value);
                        const valueInfo = optionValuesInfo?.get(valueNorm);
                        const valueExists = Boolean(valueInfo);
                        if (!valueExists) return null;

                        const valueHasAnyAvailable = valueInfo?.anyAvailable ?? false;
                        const isAvailable = valueHasAnyAvailable && isVariantCombinationAvailable(option.name, value);
                        const isSelected = selectedOptions[option.name] === value;

                        return (
                          <div key={value} className="relative">
                            <Button
                              variant="outline"
                              onClick={() => handleOptionChange(option.name, value)}
                              disabled={!isAvailable}
                              className={cn(
                                'border-2 hover:bg-yellow-900/50 relative',
                                isSelected ? 'border-yellow-500 bg-yellow-900/30 text-white' : 'border-gray-700 text-gray-300',
                                !isAvailable && 'text-gray-600 border-gray-800 bg-gray-900/50 cursor-not-allowed'
                              )}
                            >
                              {value}
                            </Button>
                            {!isAvailable && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <X className="w-full h-full text-red-500/30 stroke-1" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {hasCustomizationOptions && (
                <>
                  <div>
                    <label htmlFor="gloveId" className="text-lg font-semibold text-white mb-3 block">
                      {personalizationLabels.nameLabel}
                    </label>
                    <Input
                      id="gloveId"
                      value={gloveId}
                      onChange={(event) => setGloveId(event.target.value)}
                      placeholder={t('product.personalize.gloveIdPlaceholder')}
                      className="bg-gray-800 border-gray-700 focus:border-yellow-500 focus:ring-yellow-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="number" className="text-lg font-semibold text-white mb-3 block">
                      {personalizationLabels.numberLabel}
                    </label>
                    <Input
                      id="number"
                      value={number}
                      onChange={(event) => setNumber(event.target.value)}
                      placeholder={t('product.personalize.numberPlaceholder')}
                      className="bg-gray-800 border-gray-700 focus:border-yellow-500 focus:ring-yellow-500"
                    />
                  </div>
                </>
              )}

              <div>
                <span className="text-lg font-semibold text-white mb-3 block">{t('Quantity')}</span>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={decrementQuantity}
                    className="border-gray-700"
                    disabled={decreaseDisabled}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-xl font-bold w-10 text-center">{displayQuantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={incrementQuantity}
                    className="border-gray-700"
                    disabled={increaseDisabled}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {typeof overallVariantRemaining === 'number' && (
                  <p className="text-sm text-gray-400 mt-2">
                    {overallVariantRemaining > 0
                      ? t('product.remainingStock', { defaultValue: '{{count}} item(s) left', count: overallVariantRemaining })
                      : t('product.noMoreStock', { defaultValue: 'No additional stock available' })}
                  </p>
                )}
              </div>
            </div>

            {cartItem && (
              <div className="flex items-center justify-between mb-3 text-yellow-400 font-semibold">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  {t('In Cart')} ({cartItem.quantity})
                </span>
                {maxQuantity !== null && (
                  <span className="text-xs text-gray-300">
                    {t('product.additionalAvailable', {
                      defaultValue: '{{count}} more available',
                      count: Math.max(0, maxQuantity - cartItem.quantity),
                    })}
                  </span>
                )}
              </div>
            )}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-auto"
            >
              <Button
                onClick={handleAddToCart}
                size="lg"
                disabled={addButtonDisabled}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg flex items-center gap-2 py-6 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="h-6 w-6" />
                {cartItem
                  ? t('product.updateCartButton', { defaultValue: 'Update Cart' })
                  : selectedVariant?.availableForSale
                    ? t('Add to Cart')
                    : t('Sold Out')}
              </Button>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="prose prose-invert max-w-none text-gray-300 mt-16"
          dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
        />
      </div>
      <YouMayAlsoLike currentProductHandle={handle} />
    </>
  );
};

export default ProductPage;
