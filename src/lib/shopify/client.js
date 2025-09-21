import { GraphQLClient } from 'graphql-request';

const SHOPIFY_DOMAIN = import.meta.env.VITE_SHOPIFY_DOMAIN;
const STOREFRONT_ACCESS_TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const API_VERSION = import.meta.env.VITE_SHOPIFY_API_VERSION;

export const isShopifyEnvConfigured = () =>
  Boolean(SHOPIFY_DOMAIN && STOREFRONT_ACCESS_TOKEN && API_VERSION);

export const createShopifyClient = () => {
  if (!isShopifyEnvConfigured()) {
    return null;
  }
  const endpoint = `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`;
  return new GraphQLClient(endpoint, {
    headers: {
      'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN,
      'Shopify-Storefront-Buyer-IP': 'CLIENT_IP',
    },
  });
};
