import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import isEqual from 'lodash.isequal';
import { useShopify } from './ShopifyContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { t } = useTranslation();
  const { products } = useShopify();
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [note, setNote] = useState('');
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState([]);

  const parseQuantityAvailable = (value) => {
    if (value === null || value === undefined) return null;
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) return null;
    return Math.floor(numeric);
  };

  const normalizeCustomAttributes = (attributes) => {
    if (!Array.isArray(attributes)) return [];
    return attributes.map((attr) => ({ key: attr.key, value: attr.value }));
  };

  const normalizeVariantId = (variantId) => {
    return variantId != null ? String(variantId) : '';
  };

  useEffect(() => {
    const savedCart = localStorage.getItem('b2goalkeeping-cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart.items)) {
          setCartItems(parsedCart.items);
        }
        if (typeof parsedCart.note === 'string') {
          setNote(parsedCart.note);
        }
      } catch (err) {
        console.error('Error loading cart from localStorage:', err);
        setCartItems([]);
        setNote('');
      }
    }
  }, []);

  useEffect(() => {
    const cartData = { items: cartItems, note };
    localStorage.setItem('b2goalkeeping-cart', JSON.stringify(cartData));
  }, [cartItems, note]);

  useEffect(() => {
    if (!Array.isArray(products) || products.length === 0) return;

    setCartItems((prevItems) => {
      let hasChanges = false;
      const nextItems = prevItems.map((item) => {
        const productMatch = products.find(
          (p) => p.id === item.productId || p.handle === item.handle
        );
        if (!productMatch || !Array.isArray(productMatch.variants)) {
          return item;
        }

        const variantMatch = productMatch.variants.find(
          (variantNode) => normalizeVariantId(variantNode.id) === normalizeVariantId(item.variantId)
        );

        if (!variantMatch) {
          return item;
        }

        const refreshedMax = parseQuantityAvailable(variantMatch.quantityAvailable);
        const existingMax = typeof item.maxQuantity === 'number' ? item.maxQuantity : null;

        if (refreshedMax === existingMax) {
          return item;
        }

        hasChanges = true;
        return { ...item, maxQuantity: typeof refreshedMax === 'number' ? refreshedMax : null };
      });

      return hasChanges ? nextItems : prevItems;
    });
  }, [products]);

  const findCartItem = (variantId, customAttributes = []) => {
    const normalizedVariantId = normalizeVariantId(variantId);
    const normalizedAttributes = normalizeCustomAttributes(customAttributes);

    return cartItems.find((item) =>
      normalizeVariantId(item.variantId) === normalizedVariantId &&
      isEqual(normalizeCustomAttributes(item.customAttributes), normalizedAttributes)
    ) || null;
  };

  const isItemInCart = (variantId, customAttributes = []) => {
    return Boolean(findCartItem(variantId, customAttributes));
  };

  const getVariantQuantityInCart = (variantId) => {
    const normalizedVariantId = normalizeVariantId(variantId);
    return cartItems.reduce((total, item) => {
      return normalizeVariantId(item.variantId) === normalizedVariantId ? total + item.quantity : total;
    }, 0);
  };

  const addToCart = (product, variant, quantity, customAttributes) => {
    const sanitizedAttributes = normalizeCustomAttributes(customAttributes);
    const requestedQuantity = Math.max(1, Math.floor(Number(quantity) || 1));

    let resolvedVariant = variant;
    if (variant && variant.id && products && products.length) {
      const productMatch = products.find((p) => p.id === product.id || p.handle === product.handle);
      if (productMatch && Array.isArray(productMatch.variants)) {
        const foundVariant = productMatch.variants.find(
          (v) => String(v.id) === String(variant.id) || String(v.id) === String(variant.variantId)
        );
        if (foundVariant) {
          resolvedVariant = { ...variant, ...foundVariant };
        }
      }
    }

    if (!resolvedVariant) {
      const fallbackVariant = Array.isArray(product.variants) && product.variants.length
        ? product.variants.find((v) => v.availableForSale) || product.variants[0]
        : null;

      if (!fallbackVariant && !product.variantId) {
        toast({
          title: t('cart.add.errorTitle', { defaultValue: 'Unable to add product' }),
          description: t('cart.add.errorDescription', { defaultValue: 'We could not resolve a sellable variant for this product.' }),
          variant: 'destructive',
          duration: 3000,
        });
        return;
      }

      resolvedVariant = fallbackVariant || {
        id: product.variantId,
        price: product.price,
        currency: product.currency,
        image: product.image,
        title: '',
      };
    }

    const maxQuantityFromVariant = parseQuantityAvailable(resolvedVariant?.quantityAvailable);
    const isOutOfStock = typeof maxQuantityFromVariant === 'number' && maxQuantityFromVariant <= 0;

    if (isOutOfStock) {
      toast({
        title: t('product.unavailableTitle') || 'Produto indisponível',
        description: t('product.unavailableDescription')
          || 'A variante selecionada não está disponível no momento.',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    const itemTemplate = {
      productId: product.id,
      variantId: resolvedVariant.id,
      title: product.title,
      variantTitle: resolvedVariant.title || '',
      handle: product.handle,
      image: resolvedVariant.image?.url || product.images?.[0]?.url || product.image,
      imageAlt: resolvedVariant.image?.altText || product.title,
      price: resolvedVariant.price ?? resolvedVariant.priceV2?.amount ?? product.price,
      currency: resolvedVariant.currency ?? resolvedVariant.priceV2?.currencyCode ?? product.currency,
      quantity: requestedQuantity,
      customAttributes: sanitizedAttributes,
      maxQuantity: typeof maxQuantityFromVariant === 'number' ? maxQuantityFromVariant : null,
    };

    let additionOutcome = { type: 'none' };

    setCartItems((prevItems) => {
      const normalizedVariantId = normalizeVariantId(itemTemplate.variantId);
      const variantItems = prevItems.filter(
        (item) => normalizeVariantId(item.variantId) === normalizedVariantId
      );
      const currentQuantityForVariant = variantItems.reduce((total, item) => total + item.quantity, 0);

      const existingMaxQuantity = variantItems.find((item) => typeof item.maxQuantity === 'number')?.maxQuantity ?? null;
      const effectiveMaxQuantity =
        typeof itemTemplate.maxQuantity === 'number'
          ? itemTemplate.maxQuantity
          : existingMaxQuantity;

      if (typeof effectiveMaxQuantity === 'number') {
        if (effectiveMaxQuantity <= 0) {
          additionOutcome = {
            type: 'error',
            message: t('cart.stock.noneLeft', { defaultValue: 'This product is currently out of stock.' }),
          };
          return prevItems;
        }

        const remaining = effectiveMaxQuantity - currentQuantityForVariant;
        if (remaining <= 0) {
          additionOutcome = {
            type: 'error',
            message: t('cart.stock.maxReached', { defaultValue: 'You already have the maximum available stock in your cart.' }),
          };
          return prevItems;
        }

        const quantityToAdd = Math.min(itemTemplate.quantity, Math.max(0, remaining));

        if (quantityToAdd <= 0) {
          additionOutcome = {
            type: 'error',
            message: t('cart.stock.maxReached', { defaultValue: 'You already have the maximum available stock in your cart.' }),
          };
          return prevItems;
        }

        additionOutcome = {
          type: quantityToAdd < itemTemplate.quantity ? 'partial' : 'success',
          quantityAdded: quantityToAdd,
          maxQuantity: effectiveMaxQuantity,
        };

        let itemUpdated = false;
        const nextItems = prevItems.map((item) => {
          if (normalizeVariantId(item.variantId) !== normalizedVariantId) {
            return item;
          }

          const baseItem =
            typeof effectiveMaxQuantity === 'number' && item.maxQuantity !== effectiveMaxQuantity
              ? { ...item, maxQuantity: effectiveMaxQuantity }
              : item;

          if (!itemUpdated && isEqual(normalizeCustomAttributes(item.customAttributes), sanitizedAttributes)) {
            itemUpdated = true;
            return { ...baseItem, quantity: baseItem.quantity + quantityToAdd };
          }

          return baseItem;
        });

        if (!itemUpdated) {
          nextItems.push({
            ...itemTemplate,
            quantity: quantityToAdd,
            maxQuantity: effectiveMaxQuantity,
          });
        }

        return nextItems;
      }

      additionOutcome = {
        type: 'success',
        quantityAdded: itemTemplate.quantity,
        maxQuantity: null,
      };

      let itemUpdated = false;
      const nextItems = prevItems.map((item) => {
        if (normalizeVariantId(item.variantId) !== normalizedVariantId) {
          return item;
        }

        if (!itemUpdated && isEqual(normalizeCustomAttributes(item.customAttributes), sanitizedAttributes)) {
          itemUpdated = true;
          return { ...item, quantity: item.quantity + itemTemplate.quantity };
        }

        return item;
      });

      if (!itemUpdated) {
        nextItems.push(itemTemplate);
      }

      return nextItems;
    });

    if (additionOutcome.type === 'error') {
      toast({
        title: t('cart.stock.limitTitle', { defaultValue: 'Stock limit reached' }),
        description: additionOutcome.message,
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    const addedQuantity = additionOutcome.quantityAdded ?? requestedQuantity;
    const addedMessage = additionOutcome.type === 'partial'
      ? t('cart.stock.partialAdd', {
          defaultValue: 'Only {{quantity}} item(s) were added due to limited stock.',
          quantity: addedQuantity,
        })
      : t('product.addedToCart.description', { productName: itemTemplate.title });

    toast({
      title: t('product.addedToCart.title'),
      description: addedMessage,
      duration: 3000,
    });

    const randomSuggestions = products
      .filter((p) => p.id !== product.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    setSuggestedProducts(randomSuggestions);
    setIsSuggestionsModalOpen(true);
  };

  const removeFromCart = (variantId, customAttributes = []) => {
    const normalizedVariantId = normalizeVariantId(variantId);
    const sanitizedAttributes = normalizeCustomAttributes(customAttributes);

    setCartItems((prevItems) =>
      prevItems.filter(
        (item) =>
          !(
            normalizeVariantId(item.variantId) === normalizedVariantId &&
            isEqual(normalizeCustomAttributes(item.customAttributes), sanitizedAttributes)
          )
      )
    );
  };

  const updateQuantity = (variantId, quantity, customAttributes = []) => {
    const normalizedVariantId = normalizeVariantId(variantId);
    const sanitizedAttributes = normalizeCustomAttributes(customAttributes);
    const requestedQuantity = Math.floor(Number(quantity));

    if (requestedQuantity <= 0) {
      removeFromCart(variantId, customAttributes);
      return;
    }

    let updateOutcome = { type: 'none' };

    setCartItems((prevItems) => {
      const targetIndex = prevItems.findIndex(
        (item) =>
          normalizeVariantId(item.variantId) === normalizedVariantId &&
          isEqual(normalizeCustomAttributes(item.customAttributes), sanitizedAttributes)
      );

      if (targetIndex === -1) {
        updateOutcome = { type: 'error', message: t('cart.update.notFound', { defaultValue: 'Item not found in cart.' }) };
        return prevItems;
      }

      const targetItem = prevItems[targetIndex];
      const otherItems = prevItems.filter((item, index) => index !== targetIndex && normalizeVariantId(item.variantId) === normalizedVariantId);
      const otherQuantityTotal = otherItems.reduce((total, item) => total + item.quantity, 0);
      const effectiveMax = typeof targetItem.maxQuantity === 'number' ? targetItem.maxQuantity : null;

      if (effectiveMax !== null) {
        const allowable = effectiveMax - otherQuantityTotal;
        if (allowable <= 0) {
          updateOutcome = {
            type: 'error',
            message: t('cart.stock.noneLeft', { defaultValue: 'This product is currently out of stock.' }),
          };
          return prevItems;
        }

        const clampedQuantity = Math.min(Math.max(1, requestedQuantity), allowable);

        updateOutcome = {
          type: clampedQuantity < requestedQuantity ? 'partial' : 'success',
          quantity: clampedQuantity,
          maxQuantity: effectiveMax,
        };

        const nextItems = [...prevItems];
        nextItems[targetIndex] = { ...targetItem, quantity: clampedQuantity, maxQuantity: effectiveMax };
        return nextItems;
      }

      updateOutcome = { type: 'success', quantity: requestedQuantity };
      const nextItems = [...prevItems];
      nextItems[targetIndex] = { ...targetItem, quantity: Math.max(1, requestedQuantity) };
      return nextItems;
    });

    if (updateOutcome.type === 'error') {
      toast({
        title: t('cart.stock.limitTitle', { defaultValue: 'Stock limit reached' }),
        description: updateOutcome.message,
        variant: 'destructive',
        duration: 3000,
      });
    } else if (updateOutcome.type === 'partial') {
      toast({
        title: t('cart.stock.limitTitle', { defaultValue: 'Stock limit reached' }),
        description: t('cart.stock.partialUpdate', {
          defaultValue: 'Quantity adjusted to {{quantity}} due to limited stock.',
          quantity: updateOutcome.quantity,
        }),
        duration: 3000,
      });
    }
  };

  const clearCart = () => {
    setCartItems([]);
    setNote('');
  };

  const replaceCart = (items = [], noteValue = '') => {
    setCartItems(Array.isArray(items) ? items : []);
    setNote(noteValue || '');
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotals = () => {
    const totalPrice = cartItems.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);
    const currency = cartItems.length > 0 ? cartItems[0].currency : 'BRL';
    return { totalPrice, currency };
  };

  const closeSuggestionsModal = () => setIsSuggestionsModalOpen(false);

  const value = {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getCartTotals,
    isItemInCart,
    findCartItem,
    getVariantQuantityInCart,
    note,
    setNote,
    isSuggestionsModalOpen,
    closeSuggestionsModal,
    suggestedProducts,
    replaceCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
