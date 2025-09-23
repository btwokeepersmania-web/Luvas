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

  const isItemInCart = (variantId, customAttributes = []) => {
    return cartItems.some(item => 
      item.variantId === variantId && 
      isEqual(item.customAttributes, customAttributes)
    );
  }

  const addToCart = (product, variant, quantity, customAttributes) => {
    let itemToAdd;

    if (variant) {
        // Resolve the full variant object if possible (products are available in context)
        let resolvedVariant = variant;
        if (variant.id && products && products.length) {
          const p = products.find(p => p.id === product.id || p.handle === product.handle);
          if (p && Array.isArray(p.variants)) {
            const found = p.variants.find(v => String(v.id) === String(variant.id) || String(v.id) === String(variant.variantId));
            if (found) resolvedVariant = found;
          }
        }

        // Block adding if not available
        if (resolvedVariant && resolvedVariant.availableForSale === false) {
          toast({
            title: t('product.unavailableTitle') || "Produto indisponível",
            description: t('product.unavailableDescription') || "A variante selecionada não está disponível no momento.",
            variant: 'destructive',
            duration: 3000,
          });
          return;
        }

        itemToAdd = {
            productId: product.id,
            variantId: resolvedVariant.id,
            title: product.title,
            variantTitle: resolvedVariant.title || '',
            handle: product.handle,
            image: resolvedVariant.image?.url || product.images?.[0]?.url,
            imageAlt: resolvedVariant.image?.altText || product.title,
            price: resolvedVariant.price ?? resolvedVariant.priceV2?.amount ?? product.price,
            currency: resolvedVariant.currency ?? resolvedVariant.priceV2?.currencyCode ?? product.currency,
            quantity: quantity || 1,
            customAttributes: customAttributes || [],
        };
    } else {
        // No variant passed: try to pick the first available variant from the product
        let firstAvailable = null;
        if (product.variants && product.variants.length) {
          firstAvailable = product.variants.find(v => v.availableForSale) || product.variants[0];
        }

        if (!firstAvailable && !product.variantId) {
          toast({
            title: "Erro ao adicionar produto",
            description: "Não foi possível encontrar uma variante para este produto.",
            variant: "destructive",
            duration: 3000,
          });
          return;
        }

        const chosen = firstAvailable || { id: product.variantId, price: product.price, currency: product.currency, image: product.image, title: '' };

        if (chosen.availableForSale === false) {
          toast({
            title: t('product.unavailableTitle') || "Produto indisponível",
            description: t('product.unavailableDescription') || "A variante selecionada não está disponível no momento.",
            variant: 'destructive',
            duration: 3000,
          });
          return;
        }

        itemToAdd = {
            productId: product.id,
            variantId: chosen.id,
            title: product.title,
            variantTitle: chosen.title || '',
            handle: product.handle,
            image: chosen.image?.url || product.image,
            imageAlt: chosen.image?.altText || product.title,
            price: chosen.price ?? product.price,
            currency: chosen.currency ?? product.currency,
            quantity: quantity || 1,
            customAttributes: customAttributes || [],
        };
    }

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item =>
        item.variantId === itemToAdd.variantId &&
        isEqual(item.customAttributes, itemToAdd.customAttributes)
      );

      if (existingItem) {
        return prevItems.map(item =>
          item.variantId === itemToAdd.variantId && isEqual(item.customAttributes, itemToAdd.customAttributes)
            ? { ...item, quantity: item.quantity + itemToAdd.quantity }
            : item
        );
      } else {
        return [...prevItems, itemToAdd];
      }
    });

    toast({
      title: t('product.addedToCart.title'),
      description: t('product.addedToCart.description', { productName: itemToAdd.title }),
      duration: 3000,
    });

    const randomSuggestions = products
      .filter(p => p.id !== product.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    setSuggestedProducts(randomSuggestions);
    setIsSuggestionsModalOpen(true);
  };

  const removeFromCart = (variantId, customAttributes = []) => {
    setCartItems(prevItems => prevItems.filter(item => 
      !(item.variantId === variantId && isEqual(item.customAttributes, customAttributes))
    ));
  };

  const updateQuantity = (variantId, quantity, customAttributes = []) => {
    if (quantity <= 0) {
      removeFromCart(variantId, customAttributes);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.variantId === variantId && isEqual(item.customAttributes, customAttributes)
          ? { ...item, quantity }
          : item
      )
    );
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
