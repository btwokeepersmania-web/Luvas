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

const ProductPage = () => {
  const { handle } = useParams();
  const { fetchProductByHandle } = useShopify();
  const { addToCart } = useCart();
  const { formatPrice } = useLocalization();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [gloveId, setGloveId] = useState('');
  const [number, setNumber] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    const getProductData = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedProduct = await fetchProductByHandle(handle);
        if (fetchedProduct) {
          setProduct(fetchedProduct);
          // Prefer selecting the first available variant combination to avoid showing unavailable defaults
          let initialOptions = {};
          if (fetchedProduct.variants && fetchedProduct.variants.length) {
            const firstAvailableVariant = fetchedProduct.variants.find(v => v.availableForSale) || fetchedProduct.variants[0];
            if (firstAvailableVariant) {
              firstAvailableVariant.selectedOptions.forEach(opt => {
                initialOptions[opt.name] = opt.value;
              });
            }
          }

          // fallback: fill with first value for each option if still empty
          fetchedProduct.options.forEach(option => {
            if (!initialOptions[option.name]) initialOptions[option.name] = option.values[0];
          });

          setSelectedOptions(initialOptions);
        } else {
          setError(t('product.notFound'));
        }
      } catch (err) {
        setError(t('product.loadFailed'));
      } finally {
        setLoading(false);
      }
    };
    getProductData();
  }, [handle, fetchProductByHandle, t]);

  const selectedVariant = useMemo(() => {
    if (!product || !product.variants) return null;
    return product.variants.find(variant =>
      variant.selectedOptions.every(
        option => selectedOptions[option.name] === option.value
      )
    );
  }, [product, selectedOptions]);
  
  const hasCustomizationOptions = useMemo(() => {
    return product?.metafields?.some(mf => mf && mf.namespace === 'optionize' && mf.key === 'product_options');
  }, [product]);
  
  const customizationFields = useMemo(() => {
    if (!hasCustomizationOptions) return [];
    try {
        const optionsMetafield = product.metafields.find(mf => mf && mf.namespace === 'optionize' && mf.key === 'product_options');
        if (!optionsMetafield || !optionsMetafield.value) return [];
        const options = JSON.parse(optionsMetafield.value);
        return options?.fields || [];
    } catch (e) {
        console.error("Could not parse Optionize metafields", e);
        return [];
    }
  }, [product, hasCustomizationOptions]);

  const maxQuantity = useMemo(() => {
    return selectedVariant?.quantityAvailable ?? 0;
  }, [selectedVariant]);

  useEffect(() => {
    if (selectedVariant) {
      if (quantity > maxQuantity) {
        setQuantity(maxQuantity > 0 ? maxQuantity : 1);
      }
      if (maxQuantity === 0 && quantity !== 1) {
        setQuantity(1);
      }
    }
  }, [selectedVariant, quantity, maxQuantity]);

  const normalize = (s) => (String(s || '').trim().toLowerCase());

  const findVariantByOptions = useCallback((optionsMap) => {
    if (!product || !product.variants) return null;
    return product.variants.find(v => {
      return v.selectedOptions.every(opt => normalize(optionsMap[opt.name]) === normalize(opt.value));
    }) || null;
  }, [product]);

  const isVariantCombinationAvailable = useCallback((optionName, value) => {
    if (!product) return false;
    const tempOptions = { ...selectedOptions, [optionName]: value };
    const variant = product.variants.find(v => v.selectedOptions.every(opt => normalize(tempOptions[opt.name]) === normalize(opt.value)));
    return variant ? Boolean(variant.availableForSale) : false;
  }, [product, selectedOptions, normalize]);


  useEffect(() => {
    if (selectedVariant && selectedVariant.image) {
      const imageIndex = product.images.findIndex(img => img.id === selectedVariant.image.id);
      if (imageIndex !== -1) {
        setSelectedImageIndex(imageIndex);
      }
    }
  }, [selectedVariant, product]);


  const handleOptionChange = (optionName, value) => {
    setSelectedOptions(prev => {
      const next = { ...prev, [optionName]: value };

      // If this exact combination exists and is available, keep it
      const exact = product.variants.find(v => v.selectedOptions.every(opt => normalize(next[opt.name]) === normalize(opt.value)));
      if (exact && exact.availableForSale) return next;

      // Otherwise attempt to find a variant that has the chosen value for this option and is available
      const candidate = product.variants.find(v => v.availableForSale && v.selectedOptions.some(opt => normalize(opt.name) === normalize(optionName) && normalize(opt.value) === normalize(value)));
      if (candidate) {
        // set selected options to the candidate's options to present a real available combination
        const newSel = {};
        candidate.selectedOptions.forEach(opt => { newSel[opt.name] = opt.value; });
        return newSel;
      }

      // fallback to the selection (will be disabled)
      return next;
    });
  };

  const handleAddToCart = () => {
    if (!selectedVariant || !selectedVariant.availableForSale) return;
    
    const customAttributes = [];
    if (gloveId) customAttributes.push({ key: customizationFields.find(f => f.label.toLowerCase().includes('name'))?.label || 'Personalized Name', value: gloveId });
    if (number) customAttributes.push({ key: customizationFields.find(f => f.label.toLowerCase().includes('number'))?.label || 'Your Number', value: number });
    
    addToCart(product, selectedVariant, quantity, customAttributes);
  };

  const handleNextImage = () => setSelectedImageIndex(prev => (prev + 1) % product.images.length);
  const handlePrevImage = () => setSelectedImageIndex(prev => (prev - 1 + product.images.length) % product.images.length);

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

  return (
    <>
      <Helmet>
        <title>{`${product.title} - B2 Goalkeeping`}</title>
        <meta name="description" content={product.description} />
        <meta property="og:title" content={`${product.title} - B2 Goalkeeping`} />
        <meta property="og:description" content={product.description} />
        <meta property="og:image" content={product.images[0]?.url} />
      </Helmet>
      <div className="container mx-auto px-4 pt-32 pb-20">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          <div className="flex flex-col gap-4 items-center">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative aspect-square w-full max-w-lg overflow-hidden rounded-lg border border-yellow-500/20">
              {/* Lightweight main image: plain <img> to reduce JS and animation cost */}
              <img
                key={selectedImageIndex}
                src={product.images[selectedImageIndex].url}
                alt={product.images[selectedImageIndex].altText || product.title}
                className="w-full h-full object-cover product-main-image transition-opacity duration-300 ease-in-out"
                loading="eager"
                decoding="async"
                style={{ opacity: 1 }}
              />
              {product.images.length > 1 && (
                <>
                  <Button onClick={handlePrevImage} size="icon" variant="ghost" className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white"><ChevronLeft /></Button>
                  <Button onClick={handleNextImage} size="icon" variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white"><ChevronRight /></Button>
                </>
              )}
            </motion.div>
            <div className="grid grid-cols-5 gap-2 w-full max-w-lg">
              {product.images.map((image, index) => (
                <div key={image.id} onClick={() => setSelectedImageIndex(index)} className={`aspect-square cursor-pointer rounded-md overflow-hidden border-2 transition-all ${selectedImageIndex === index ? 'border-yellow-500' : 'border-transparent hover:border-yellow-500/50'}`}>
                  <img src={image.url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col">
            <motion.h1 initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }} className="text-4xl md:text-5xl font-bold mb-2 gradient-text">{product.title}</motion.h1>
            <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }} className="flex items-baseline gap-4 mb-4">
              <span className="text-4xl font-bold text-yellow-400">{formatPrice(selectedVariant?.price || product.price, selectedVariant?.currency || product.currency)}</span>
              {(selectedVariant?.compareAtPrice || product.compareAtPrice) && <span className="text-xl text-gray-500 line-through">{formatPrice(selectedVariant?.compareAtPrice || product.compareAtPrice, selectedVariant?.currency || product.currency)}</span>}
            </motion.div>
            <p className="text-sm text-gray-400 mb-6">{t('product.taxAndShipping')}</p>

            <div className="space-y-6 mb-8">
              {product.options.map(option => (
                <div key={option.id}>
                  <span className="text-lg font-semibold text-white mb-3 block">{option.name}</span>
                  <div className="flex flex-wrap gap-3">
                    {option.values.map(value => {
                      const isSelected = selectedOptions[option.name] === value;

                      // Check if this value exists among product variants at all
                      const valueExists = product.variants.some(v => v.selectedOptions.some(opt => normalize(opt.name) === normalize(option.name) && normalize(opt.value) === normalize(value)));

                      // Check if any variant with this value is available
                      const valueHasAnyAvailable = product.variants.some(v => v.availableForSale && v.selectedOptions.some(opt => normalize(opt.name) === normalize(option.name) && normalize(opt.value) === normalize(value)));

                      // Determine availability for the current selection context
                      const isAvailable = valueExists ? isVariantCombinationAvailable(option.name, value) && valueHasAnyAvailable : false;

                      // If the value doesn't exist in any variant, hide it entirely (prevents showing phantom options)
                      if (!valueExists) return null;

                      return (
                        <div key={value} className="relative">
                          <Button
                            variant="outline"
                            onClick={() => handleOptionChange(option.name, value)}
                            disabled={!isAvailable}
                            className={cn(
                              "border-2 hover:bg-yellow-900/50 relative",
                              isSelected ? "border-yellow-500 bg-yellow-900/30 text-white" : "border-gray-700 text-gray-300",
                              !isAvailable && "text-gray-600 border-gray-800 bg-gray-900/50 cursor-not-allowed"
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
              ))}
              
              {hasCustomizationOptions && (
                <>
                  <div>
                    <label htmlFor="gloveId" className="text-lg font-semibold text-white mb-3 block">
                      {customizationFields.find(f => f.label.toLowerCase().includes('name'))?.label || 'Personalized Name'}
                    </label>
                    <Input id="gloveId" value={gloveId} onChange={(e) => setGloveId(e.target.value)} placeholder={t('product.personalize.gloveIdPlaceholder')} className="bg-gray-800 border-gray-700 focus:border-yellow-500 focus:ring-yellow-500" />
                  </div>
                  
                  <div>
                    <label htmlFor="number" className="text-lg font-semibold text-white mb-3 block">
                       {customizationFields.find(f => f.label.toLowerCase().includes('number'))?.label || 'Your Number'}
                    </label>
                    <Input id="number" value={number} onChange={(e) => setNumber(e.target.value)} placeholder={t('product.personalize.numberPlaceholder')} className="bg-gray-800 border-gray-700 focus:border-yellow-500 focus:ring-yellow-500" />
                  </div>
                </>
              )}


              <div>
                <span className="text-lg font-semibold text-white mb-3 block">{t('Quantity')}</span>
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="border-gray-700" disabled={quantity <= 1}><Minus className="h-4 w-4" /></Button>
                  <span className="text-xl font-bold w-10 text-center">{quantity}</span>
                  <Button variant="outline" size="icon" onClick={() => setQuantity(q => Math.min(q + 1, maxQuantity))} className="border-gray-700" disabled={quantity >= maxQuantity || maxQuantity === 0}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>

            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }} className="mt-auto">
              <Button onClick={handleAddToCart} size="lg" disabled={!selectedVariant || !selectedVariant.availableForSale} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg flex items-center gap-2 py-6 disabled:bg-gray-600 disabled:cursor-not-allowed">
                <ShoppingCart className="h-6 w-6" />
                {selectedVariant?.availableForSale ? t('Add to Cart') : t('Sold Out')}
              </Button>
            </motion.div>
          </div>
        </motion.div>
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.5 }} className="prose prose-invert max-w-none text-gray-300 mt-16" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
      </div>
      <YouMayAlsoLike currentProductHandle={handle} />
    </>
  );
};

export default ProductPage;
