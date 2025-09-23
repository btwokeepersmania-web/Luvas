import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useShopify } from './ShopifyContext.jsx';
import { useCart } from './CartContext.jsx';
import { toast } from '@/components/ui/use-toast.js';
import { useTranslation } from 'react-i18next';
import { customerAccountFetch, isAuthenticated as isCustomerAuthAuthenticated } from '@/lib/shopify/customerAuth.js';
import { getCustomerByEmail, isAdminApiConfigured, saveCustomerCart, clearCustomerCart } from '@/lib/shopify/adminApi.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const { customerCreate, customerAccessTokenCreate, customerAccessTokenDelete, getCustomer } = useShopify();
  const { clearCart, cartItems, note, replaceCart } = useCart();
  const { t } = useTranslation();
  const adminApiEnabled = isAdminApiConfigured();
  const cartHydrated = useRef(false);
  const cartPersistTimeout = useRef(null);

  const normalizeCustomerShape = useCallback((rawCustomer) => {
    if (!rawCustomer) return null;

    const normalizeAddresses = () => {
      if (Array.isArray(rawCustomer.addresses)) {
        return rawCustomer.addresses.map((address) => ({ ...address }));
      }
      if (Array.isArray(rawCustomer.addresses?.edges)) {
        return rawCustomer.addresses.edges.map(({ node }) => ({ ...node }));
      }
      return [];
    };

    const normalizeOrders = () => {
      if (Array.isArray(rawCustomer.orders)) {
        return rawCustomer.orders.map((order) => ({ ...order }));
      }
      if (Array.isArray(rawCustomer.orders?.edges)) {
        return rawCustomer.orders.edges.map(({ node }) => ({ ...node }));
      }
      return [];
    };

    const normalizeLoyalty = () => {
      const loyalty = rawCustomer.loyalty || {};
      const data = rawCustomer.loyaltyData || {};
      const maxDiscountPercent = loyalty.maxDiscountPercent ?? data.maxDiscountPercent ?? Number.parseFloat(import.meta.env.VITE_LOYALTY_MAX_DISCOUNT_PERCENT || '15');
      const availablePoints = loyalty.availablePoints ?? Math.max(0, (data.totalPoints || 0) - (data.redeemedPoints || 0));
      let maxRedeemablePoints = loyalty.maxRedeemablePoints ?? data.maxRedeemablePoints;
      if (!Number.isFinite(maxRedeemablePoints)) {
        const cappedPercent = Math.max(0, Math.min(100, Number.isFinite(maxDiscountPercent) ? maxDiscountPercent : 15));
        maxRedeemablePoints = cappedPercent > 0 ? Math.floor((availablePoints * cappedPercent) / 100) : availablePoints;
      }
      if (availablePoints > 0 && (!Number.isFinite(maxRedeemablePoints) || maxRedeemablePoints <= 0)) {
        const cappedPercent = Math.max(0, Math.min(100, Number.isFinite(maxDiscountPercent) ? maxDiscountPercent : 15));
        maxRedeemablePoints = cappedPercent > 0 ? Math.floor((availablePoints * cappedPercent) / 100) : availablePoints;
      }
      if (availablePoints > 0) {
        maxRedeemablePoints = Math.max(1, Math.min(availablePoints, Number.isFinite(maxRedeemablePoints) ? maxRedeemablePoints : availablePoints));
      } else {
        maxRedeemablePoints = 0;
      }
      return {
        totalPoints: loyalty.totalPoints ?? data.totalPoints ?? 0,
        redeemedPoints: loyalty.redeemedPoints ?? data.redeemedPoints ?? 0,
        availablePoints,
        discountValue: loyalty.discountValue ?? 0,
        threshold: loyalty.threshold ?? 0,
        thresholdReached: loyalty.thresholdReached ?? false,
        pennyPerPoint: loyalty.pennyPerPoint ?? null,
        currency: loyalty.currency ?? null,
        redemptions: Array.isArray(loyalty.redemptions) ? loyalty.redemptions : (Array.isArray(data.redemptions) ? data.redemptions : []),
        maxRedeemablePoints,
        maxDiscountPercent,
      };
    };

    return {
      ...rawCustomer,
      phone: rawCustomer.phone || rawCustomer.phoneNumber?.phoneNumber || '',
      addresses: normalizeAddresses(),
      orders: normalizeOrders(),
      defaultAddress: rawCustomer.defaultAddress ? { ...rawCustomer.defaultAddress } : null,
      loyalty: normalizeLoyalty(),
      savedCart: rawCustomer.savedCart || null,
    };
  }, []);

  const hydrateWithAdminData = useCallback(
    async (baseCustomer) => {
      if (!baseCustomer) return null;
      let normalized = normalizeCustomerShape(baseCustomer);

      if (adminApiEnabled && normalized?.email) {
        try {
          const adminCustomer = await getCustomerByEmail(normalized.email);
          if (adminCustomer) {
            normalized = normalizeCustomerShape({ ...normalized, ...adminCustomer });
          }
        } catch (error) {
          console.error('Failed to hydrate customer with admin data:', error);
        }
      }

      setCustomer(normalized);
      return normalized;
    },
    [adminApiEnabled, normalizeCustomerShape]
  );

  const logout = useCallback(async () => {
    if (token) {
      try {
        await customerAccessTokenDelete(token);
      } catch (error) {
        console.error('Error during token deletion:', error);
      }
    }

    try {
      await fetch('/.netlify/functions/logout', { method: 'POST' });
    } catch (error) {
      console.error('Server-side logout failed:', error);
    }

    localStorage.removeItem('customerAccessToken');
    localStorage.removeItem('shopify_access_token');
    localStorage.removeItem('shopify_refresh_token');
    localStorage.removeItem('customAuthToken');
    localStorage.removeItem('customerData');
    setCustomer(null);
    setToken(null);
    clearCart();
    toast({ title: t('account.logout.success') });
  }, [token, clearCart, t, customerAccessTokenDelete]);

  const fetchCustomerData = useCallback(
    async (accessToken) => {
      try {
        const { customer: customerData } = await getCustomer(accessToken);
        return await hydrateWithAdminData(customerData);
      } catch (error) {
        console.error('Failed to fetch customer data:', error);
        await logout();
        return null;
      }
    },
    [getCustomer, hydrateWithAdminData, logout]
  );

  const fetchCustomerFromAPI = useCallback(async () => {
    try {
      const query = `
        query getCustomer {
          customer {
            id
            firstName
            lastName
            displayName
            email
            phone
            phoneNumber {
              phoneNumber
            }
            defaultAddress {
              id
              firstName
              lastName
              company
              address1
              address2
              city
              province
              provinceCode
              zip
              country
              countryCode
              phone
            }
            addresses(first: 10) {
              edges {
                node {
                  id
                  address1
                  address2
                  city
                  country
                  countryCode
                  zip
                  province
                  provinceCode
                  firstName
                  lastName
                  company
                  phone
                }
              }
            }
            orders(first: 10, sortKey: PROCESSED_AT, reverse: true) {
              edges {
                node {
                  id
                  orderNumber
                  processedAt
                  financialStatus
                  fulfillmentStatus
                  totalPrice {
                    amount
                    currencyCode
                  }
                  lineItems(first: 5) {
                    edges {
                      node {
                        title
                        quantity
                        variant {
                          image {
                            url
                            altText
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response = await customerAccountFetch(query);
      if (response.data?.customer) {
        return await hydrateWithAdminData(response.data.customer);
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch customer from API:', error);
      return null;
    }
  }, [hydrateWithAdminData]);

  useEffect(() => {
    if (!customer?.id || !adminApiEnabled) {
      cartHydrated.current = false;
      return;
    }

    const savedCart = customer.savedCart;
    if (!cartHydrated.current) {
      if (savedCart && Array.isArray(savedCart.items)) {
        replaceCart(savedCart.items, savedCart.note || '');
      }
      cartHydrated.current = true;
    }

    return () => {
      if (cartPersistTimeout.current) {
        clearTimeout(cartPersistTimeout.current);
        cartPersistTimeout.current = null;
      }
    };
  }, [customer?.id, customer?.savedCart, adminApiEnabled, replaceCart]);

  useEffect(() => {
    if (!customer?.id || !adminApiEnabled || !cartHydrated.current) {
      return () => {};
    }

    if (cartPersistTimeout.current) {
      clearTimeout(cartPersistTimeout.current);
    }

    const state = { items: cartItems, note };

    cartPersistTimeout.current = setTimeout(async () => {
      try {
        const shouldClear = state.items.length === 0 && (!state.note || state.note.trim() === '');
        if (shouldClear) {
          await clearCustomerCart(customer.id);
          setCustomer((prev) => (prev ? { ...prev, savedCart: null } : prev));
          localStorage.removeItem('b2goalkeeping-cart');
        } else {
          await saveCustomerCart(customer.id, state);
          setCustomer((prev) => (prev ? { ...prev, savedCart: state } : prev));
        }
      } catch (error) {
        console.error('Failed to sync cart state:', error);
      }
    }, 500);

    return () => {
      if (cartPersistTimeout.current) {
        clearTimeout(cartPersistTimeout.current);
        cartPersistTimeout.current = null;
      }
    };
  }, [customer?.id, adminApiEnabled, cartItems, note]);

  useEffect(() => {
    if (typeof window === 'undefined') return () => {};

    const handleAuthMessage = async (event) => {
      if (!event?.data || event.origin !== window.location.origin) return;
      if (event.data.source !== 'shopify-auth') return;

      if (event.data.status === 'success') {
        try {
          await fetchCustomerFromAPI();
        } catch (err) {
          console.error('Failed to refresh customer after popup login:', err);
        }
      }

      if (event.data.status === 'error') {
        console.error('Shopify login error:', event.data.error);
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, [fetchCustomerFromAPI]);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);

      const customToken = localStorage.getItem('customAuthToken');
      const customerDataString = localStorage.getItem('customerData');

      if (customToken && customerDataString) {
        try {
          const customerData = JSON.parse(customerDataString);
          await hydrateWithAdminData(customerData);
        } catch (error) {
          console.error('Failed to parse customer data:', error);
          localStorage.removeItem('customAuthToken');
          localStorage.removeItem('customerData');
        }
      } else if (isCustomerAuthAuthenticated()) {
        try {
          await fetchCustomerFromAPI();
        } catch (error) {
          console.error('Customer Account API auth failed:', error);
        }
      } else {
        const storedToken = localStorage.getItem('customerAccessToken');
        if (storedToken) {
          try {
            const parsedToken = JSON.parse(storedToken);
            if (new Date(parsedToken.expiresAt) > new Date()) {
              setToken(parsedToken.accessToken);
              await fetchCustomerData(parsedToken.accessToken);
            } else {
              localStorage.removeItem('customerAccessToken');
            }
          } catch (error) {
            console.error('Failed to parse token:', error);
            localStorage.removeItem('customerAccessToken');
          }
        }
      }

      setLoading(false);
    };

    initializeAuth();
  }, [fetchCustomerData, fetchCustomerFromAPI, hydrateWithAdminData]);

  const handleLogin = async (email, password) => {
    try {
      const result = await customerAccessTokenCreate({ email, password });
      if (result.customerAccessTokenCreate.customerAccessToken) {
        const { accessToken, expiresAt } = result.customerAccessTokenCreate.customerAccessToken;
        localStorage.setItem('customerAccessToken', JSON.stringify({ accessToken, expiresAt }));
        setToken(accessToken);
        await fetchCustomerData(accessToken);
        toast({ title: t('auth.login.success') });
        return { success: true };
      }

      const errorMessages = result.customerAccessTokenCreate.customerUserErrors.map((error) => error.message).join(', ');
      toast({ title: t('auth.login.error'), description: errorMessages, variant: 'destructive' });
      return { success: false, error: errorMessages };
    } catch (error) {
      toast({ title: t('auth.login.error'), description: error.message, variant: 'destructive' });
      return { success: false, error: error.message };
    }
  };

  const handleRegister = async (input) => {
    try {
      const result = await customerCreate(input);
      if (result.customerCreate.customer) {
        toast({ title: t('auth.register.success'), description: t('auth.register.successDescription') });
        return { success: true };
      }

      const errorMessages = result.customerCreate.customerUserErrors.map((error) => error.message).join(', ');
      toast({ title: t('auth.register.error'), description: errorMessages, variant: 'destructive' });
      return { success: false, error: errorMessages };
    } catch (error) {
      toast({ title: t('auth.register.error'), description: error.message, variant: 'destructive' });
      return { success: false, error: error.message };
    }
  };

  const handleCustomLogin = (customerData, authToken) => {
    localStorage.setItem('customAuthToken', authToken);
    localStorage.setItem('customerData', JSON.stringify(customerData));
    hydrateWithAdminData(customerData);
  };

  const value = {
    isAuthenticated: !!customer || isCustomerAuthAuthenticated(),
    customer,
    loading,
    token,
    login: handleLogin,
    register: handleRegister,
    logout,
    fetchCustomerData,
    fetchCustomerFromAPI,
    handleCustomLogin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
