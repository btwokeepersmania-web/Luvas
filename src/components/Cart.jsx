import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Plus, Minus, ShoppingBag, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { useCart } from '@/context/CartContext.jsx';
import { useShopify } from '@/context/ShopifyContext.jsx';
import { useLocalization } from '@/context/LocalizationContext.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { toast } from '@/components/ui/use-toast.js';
import { Textarea } from '@/components/ui/textarea.jsx';

const Cart = () => {
  const { 
    cartItems, 
    isCartOpen, 
    setIsCartOpen, 
    removeFromCart, 
    updateQuantity, 
    getCartTotals,
    getTotalItems,
    note,
    setNote,
    getVariantQuantityInCart,
  } = useCart();
  
  const { createCartAndGetCheckoutUrl } = useShopify();
  const { formatPrice } = useLocalization();
  const { t } = useTranslation();
  const { token, customer } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast({
        title: t('cart.empty.title'),
        description: t('cart.empty.description'),
        variant: "destructive",
      });
      return;
    }

    setIsCheckingOut(true);
    try {
      const lineItems = cartItems.map(item => ({
        variantId: item.variantId,
        quantity: item.quantity,
        customAttributes: item.customAttributes || [],
      }));

      // Use default address if customer is logged in and has one
      const defaultAddress = customer?.defaultAddress;
      const shippingAddress = defaultAddress ? {
        firstName: defaultAddress.firstName || customer?.firstName || '',
        lastName: defaultAddress.lastName || customer?.lastName || '',
        company: defaultAddress.company || '',
        address1: defaultAddress.address1,
        address2: defaultAddress.address2 || '',
        city: defaultAddress.city,
        province: defaultAddress.province || '',
        provinceCode: defaultAddress.provinceCode || '',
        zip: defaultAddress.zip || '',
        country: defaultAddress.country,
        countryCode: (defaultAddress.countryCode || '').toUpperCase(),
        phone: defaultAddress.phone || customer?.phone || '',
      } : null;

      const buyerInfo = {
        email: customer?.email || undefined,
        phone: customer?.phone || customer?.phoneNumber?.phoneNumber || shippingAddress?.phone || undefined,
      };

      const checkoutUrl = await createCartAndGetCheckoutUrl(lineItems, token, note, shippingAddress, buyerInfo);

      if (checkoutUrl) {
        // Show confirmation toast if using default address
        if (shippingAddress) {
          toast({
            title: t('cart.checkout.usingDefaultAddress'),
            description: t('cart.checkout.usingDefaultAddressDescription'),
          });
        }

        window.location.href = checkoutUrl;
      } else {
        throw new Error(t('cart.checkout.error.url'));
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: t('cart.checkout.error.title'),
        description: `${t('cart.checkout.error.description')} ${error.message}`,
        variant: "destructive",
        duration: 5000,
      });
      setIsCheckingOut(false);
    }
  };
  
  const { totalPrice, currency } = getCartTotals();

  const cartVariants = {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
    checkingOut: {
      scale: 0.9,
      rotate: 2,
      opacity: 0.8,
      transition: { duration: 0.5, ease: 'circOut' }
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          <motion.div
            variants={cartVariants}
            initial="initial"
            animate={isCheckingOut ? "checkingOut" : "animate"}
            exit="exit"
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-950 border-l border-yellow-500/20 z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-yellow-500/20">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="h-6 w-6 text-yellow-400" />
                <h2 className="text-xl font-bold text-white">
                  {t('cart.title')} ({getTotalItems()})
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCartOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag className="h-16 w-16 text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">
                    {t('cart.empty.title')}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {t('cart.empty.callToAction')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => {
                    const variantTotal = getVariantQuantityInCart(item.variantId);
                    const remainingStock = typeof item.maxQuantity === 'number'
                      ? Math.max(0, item.maxQuantity - variantTotal)
                      : null;
                    const plusDisabled = typeof remainingStock === 'number' && remainingStock <= 0;

                    return (
                    <motion.div
                      key={`${item.variantId}-${JSON.stringify(item.customAttributes)}`}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-start space-x-4 p-4 bg-gray-900 rounded-lg border border-yellow-500/20"
                    >
                      <div className="flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.imageAlt}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium text-sm">
                          {item.title}
                        </h3>
                        <p className="text-gray-400 text-xs">{item.variantTitle}</p>
                        {item.customAttributes && item.customAttributes.length > 0 && (
                          <div className="mt-1 text-xs text-gray-400">
                            {item.customAttributes.map(attr => (
                              <div key={attr.key}>{attr.key}: {attr.value}</div>
                            ))}
                          </div>
                        )}
                        <p className="text-yellow-400 font-semibold text-sm mt-2">
                          {formatPrice(item.price, item.currency)}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1, item.customAttributes)}
                            className="h-8 w-8 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500 hover:text-black"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-white font-medium min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1, item.customAttributes)}
                            disabled={plusDisabled}
                            className="h-8 w-8 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500 hover:text-black disabled:opacity-60"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        {typeof remainingStock === 'number' && (
                          <p className="text-xs text-gray-500 mt-1">
                            {remainingStock > 0
                              ? t('product.remainingStock', { defaultValue: '{{count}} item(s) left', count: remainingStock })
                              : t('product.noMoreStock', { defaultValue: 'No additional stock available' })}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.variantId, item.customAttributes)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="border-t border-yellow-500/20 p-6 space-y-4">
                <div>
                  <label htmlFor="cart-note" className="text-sm font-medium text-gray-300 mb-2 block">{t('cart.note.label')}</label>
                  <Textarea
                    id="cart-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t('cart.note.placeholder')}
                    className="bg-gray-800 border-yellow-500/30 text-white placeholder:text-gray-400 focus:border-yellow-500 resize-none"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-white">{t('cart.total')}:</span>
                  <span className="text-2xl font-bold text-yellow-400">
                    {formatPrice(totalPrice, currency)}
                  </span>
                </div>
                <Button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  size="lg"
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                >
                  {isCheckingOut ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    t('cart.checkout.button')
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Cart;
