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

const ProductPage = () => {
  const { handle } = useParams();
  const { fetchProductByHandle } = useShopify();
  const { addToCart } = useCart();
  const { formatPrice } = useLocalization();
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
  }, [handle, fetchProductByHandle, t]);

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

  const maxQuantity = useMemo(() => selectedVariant?.quantityAvailable ?? 0, [selectedVariant]);

  useEffect(() => {
    if (!selectedVariant) return;
    if (maxQuantity > 0 && quantity > maxQuantity) {
      setQuantity(maxQuantity);
    }
    if (maxQuantity === 0 && quantity !== 1) {
      setQuantity(1);
    }
  }, [selectedVariant, maxQuantity, quantity]);

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

  const handleAddToCart = useCallback(() => {
    if (!selectedVariant || !selectedVariant.availableForSale) return;

    const customAttributes = [];
    if (gloveId) {
      customAttributes.push({ key: personalizationLabels.nameLabel, value: gloveId });
    }
    if (number) {
      customAttributes.push({ key: personalizationLabels.numberLabel, value: number });
    }

    addToCart(product, selectedVariant, quantity, customAttributes);
  }, [addToCart, gloveId, number, personalizationLabels, product, quantity, selectedVariant]);

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
              className="flex items-baseline gap-4 mb-4"
            >
              <span className="text-4xl font-bold text-yellow-400">
                {formatPrice(selectedVariant?.price || product.price, selectedVariant?.currency || product.currency)}
              </span>
              {(selectedVariant?.compareAtPrice || product.compareAtPrice) && (
                <span className="text-xl text-gray-500 line-through">
                  {formatPrice(
                    selectedVariant?.compareAtPrice || product.compareAtPrice,
                    selectedVariant?.currency || product.currency
                  )}
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
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="border-gray-700"
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-xl font-bold w-10 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity((prev) => Math.min(prev + 1, maxQuantity || prev + 1))}
                    className="border-gray-700"
                    disabled={maxQuantity !== 0 && quantity >= maxQuantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-auto"
            >
              <Button
                onClick={handleAddToCart}
                size="lg"
                disabled={!selectedVariant || !selectedVariant.availableForSale}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg flex items-center gap-2 py-6 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="h-6 w-6" />
                {selectedVariant?.availableForSale ? t('Add to Cart') : t('Sold Out')}
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
