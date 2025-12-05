import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
  const {
    country,
    language,
    localization,
  } = useLocalization();
  const [shopInfo, setShopInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const client = useMemo(() => createShopifyClient(), []);

  const DEFAULT_COUNTRY_CODE = import.meta.env.VITE_DEFAULT_COUNTRY_CODE || 'GB';
  const DEFAULT_LANGUAGE_CODE = import.meta.env.VITE_DEFAULT_LANGUAGE_CODE || 'EN';

  const { resolvedCountry, resolvedLanguage } = useMemo(() => {
    const fallbackCountry = country
      || localization?.availableCountries?.find((item) => item.isoCode === DEFAULT_COUNTRY_CODE)
      || localization?.availableCountries?.[0]
      || (DEFAULT_COUNTRY_CODE ? { isoCode: DEFAULT_COUNTRY_CODE } : null);

    const fallbackLanguage = language
      || fallbackCountry?.availableLanguages?.find((item) => item.isoCode === DEFAULT_LANGUAGE_CODE)
      || fallbackCountry?.availableLanguages?.[0]
      || (DEFAULT_LANGUAGE_CODE ? { isoCode: DEFAULT_LANGUAGE_CODE } : null);

    return {
      resolvedCountry: fallbackCountry,
      resolvedLanguage: fallbackLanguage,
    };
  }, [country, language, localization, DEFAULT_COUNTRY_CODE, DEFAULT_LANGUAGE_CODE]);

  const shopifyFetch = useCallback(async (query, variables = {}) => {
    try {
      if (!client) {
        throw new Error('Shopify configuration is missing.');
      }

      if (!resolvedCountry?.isoCode || !resolvedLanguage?.isoCode) {
        throw new Error('Localization settings unavailable.');
      }

      const contextVariables = {
        ...variables,
        country: resolvedCountry.isoCode,
        language: resolvedLanguage.isoCode,
      };
      return await client.request(query, contextVariables);
    } catch (err) {
      console.error('Shopify API Error:', err);
      const errorMessage = err.response?.errors?.[0]?.message || err.message;
      throw new Error(errorMessage);
    }
  }, [client, resolvedCountry?.isoCode, resolvedLanguage?.isoCode]);

  useEffect(() => {
    const loadData = async () => {
      if (!client) {
        setLoading(false);
        setError('Shopify configuration is missing.');
        return;
      }

      if (!resolvedCountry?.isoCode || !resolvedLanguage?.isoCode) {
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
  }, [client, resolvedCountry?.isoCode, resolvedLanguage?.isoCode, shopifyFetch]);

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
    createCartAndGetCheckoutUrl: (lineItems, customerAccessToken, note, shippingAddress, buyerInfo) =>
      cartMutations.createCartAndGetCheckoutUrl(shopifyFetch, lineItems, customerAccessToken, note, shippingAddress, buyerInfo),
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
