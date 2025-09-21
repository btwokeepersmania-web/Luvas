import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useLocalization } from './LocalizationContext.jsx';
import { createShopifyClient } from '@/lib/shopify/client.js';
import { fetchShopInfo } from '@/lib/shopify/queries/shop.js';
import { fetchProducts } from '@/lib/shopify/queries/product.js';
import { fetchCollections } from '@/lib/shopify/queries/collection.js';
import * as productQueries from '@/lib/shopify/queries/product.js';
import * as collectionQueries from '@/lib/shopify/queries/collection.js';
import * as metaobjectQueries from '@/lib/shopify/queries/metaobject.js';
import * as customerQueries from '@/lib/shopify/queries/customer.js';
import * as cartMutations from '@/lib/shopify/mutations/cart.js';
import * as customerMutations from '@/lib/shopify/mutations/customer.js';

const ShopifyContext = createContext();

export const useShopify = () => {
  const context = useContext(ShopifyContext);
  if (!context) {
    throw new Error('useShopify must be used within a ShopifyProvider');
  }
  return context;
};

export const ShopifyProvider = ({ children }) => {
  const { country, language } = useLocalization();
  const [shopInfo, setShopInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const client = useMemo(() => createShopifyClient(), []);

  const shopifyFetch = async (query, variables = {}) => {
    try {
      if (!client) {
        throw new Error('Shopify configuration is missing.');
      }

      // If localization isn't ready yet, wait briefly for it (up to timeout)
      const waitForLocalization = async (timeout = 3000) => {
        const start = Date.now();
        while ((!country || !language) && (Date.now() - start) < timeout) {
          // eslint-disable-next-line no-await-in-loop
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      };

      await waitForLocalization(3000);

      if (!country || !language) {
        // Provide a non-throwing fallback to avoid crashing render flows; return an empty object
        const msg = 'Localization not initialized yet.';
        console.warn('Shopify fetch aborted:', msg);
        throw new Error(msg);
      }

      const contextVariables = {
        ...variables,
        country: country.isoCode,
        language: language.isoCode,
      };
      return await client.request(query, contextVariables);
    } catch (err) {
      console.error('Shopify API Error:', err);
      const errorMessage = err.response?.errors?.[0]?.message || err.message;
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!client) {
        setLoading(false);
        setError('Shopify configuration is missing.');
        return;
      }
      if (!country || !language) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [fetchedShopInfo, fetchedProducts, fetchedCollections] = await Promise.all([
          fetchShopInfo(shopifyFetch),
          fetchProducts(shopifyFetch),
          fetchCollections(shopifyFetch)
        ]);
        setShopInfo(fetchedShopInfo);
        setProducts(fetchedProducts);
        setCollections(fetchedCollections);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [country, language, client]);

  const value = {
    shopInfo,
    products,
    collections,
    loading,
    error,
    fetchProductByHandle: (handle) => productQueries.fetchProductByHandle(shopifyFetch, handle),
    fetchCollectionByHandle: (handle) => collectionQueries.fetchCollectionByHandle(shopifyFetch, handle),
    fetchCollectionProducts: (collectionId) => collectionQueries.fetchCollectionProducts(shopifyFetch, collectionId),
    fetchPolicy: (handle) => metaobjectQueries.fetchPolicy(shopifyFetch, handle),
    createCartAndGetCheckoutUrl: (lineItems, customerAccessToken, note) => cartMutations.createCartAndGetCheckoutUrl(shopifyFetch, lineItems, customerAccessToken, note),
    fetchSubscriptionPlans: () => productQueries.fetchSubscriptionPlans(shopifyFetch),
    subscribeToEmailMarketing: (email) => customerMutations.subscribeToEmailMarketing(shopifyFetch, email),
    customerCreate: (input) => customerMutations.customerCreate(shopifyFetch, input),
    customerAccessTokenCreate: (input) => customerMutations.customerAccessTokenCreate(shopifyFetch, input),
    customerAccessTokenDelete: (token) => customerMutations.customerAccessTokenDelete(shopifyFetch, token),
    getCustomer: (token) => customerQueries.getCustomer(client, token),
    shopifyFetch,
  };

  return (
    <ShopifyContext.Provider value={value}>
      {children}
    </ShopifyContext.Provider>
  );
};
