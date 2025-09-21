import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useShopify } from './ShopifyContext.jsx';
import { useCart } from './CartContext.jsx';
import { toast } from '@/components/ui/use-toast.js';
import { useTranslation } from 'react-i18next';
import { customerAccountFetch, getAccessToken, isAuthenticated as isCustomerAuthAuthenticated } from '@/lib/shopify/customerAuth.js';

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
  const { clearCart } = useCart();
  const { t } = useTranslation();

  const fetchCustomerData = useCallback(async (accessToken) => {
    try {
      const { customer: customerData } = await getCustomer(accessToken);
      setCustomer(customerData);
      return customerData;
    } catch (error) {
      console.error('Failed to fetch customer data:', error);
      await logout();
      return null;
    }
  }, [getCustomer]);

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
            phoneNumber {
              phoneNumber
            }
            addresses(first: 10) {
              edges {
                node {
                  id
                  address1
                  address2
                  city
                  country
                  zip
                  province
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
        setCustomer(response.data.customer);
        return response.data.customer;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch customer from API:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);

      const customToken = localStorage.getItem('customAuthToken');
      const customerDataString = localStorage.getItem('customerData');

      if (customToken && customerDataString) {
        try {
          const customerData = JSON.parse(customerDataString);
          setCustomer(customerData);
        } catch (e) {
          console.error('Failed to parse customer data:', e);
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
        // Fallback to Storefront API authentication
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
          } catch (e) {
            console.error('Failed to parse token:', e);
            localStorage.removeItem('customerAccessToken');
          }
        }
      }

      setLoading(false);
    };
    initializeAuth();
  }, [fetchCustomerData, fetchCustomerFromAPI]);

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
      } else {
        const errorMessages = result.customerAccessTokenCreate.customerUserErrors.map(e => e.message).join(', ');
        toast({ title: t('auth.login.error'), description: errorMessages, variant: 'destructive' });
        return { success: false, error: errorMessages };
      }
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
      } else {
        const errorMessages = result.customerCreate.customerUserErrors.map(e => e.message).join(', ');
        toast({ title: t('auth.register.error'), description: errorMessages, variant: 'destructive' });
        return { success: false, error: errorMessages };
      }
    } catch (error) {
      toast({ title: t('auth.register.error'), description: error.message, variant: 'destructive' });
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await customerAccessTokenDelete(token);
      } catch (error) {
        console.error('Error during token deletion:', error);
      }
    }

    // Call server to clear httpOnly cookies
    try {
      await fetch('/.netlify/functions/logout', { method: 'POST' });
    } catch (e) {
      console.error('Server-side logout failed:', e);
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
