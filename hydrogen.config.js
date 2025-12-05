import {defineConfig} from '@shopify/hydrogen/config';

export default defineConfig({
  shopify: {
    storeDomain: process.env.VITE_SHOPIFY_STORE_DOMAIN,
    storefrontToken: process.env.VITE_SHOPIFY_STOREFRONT_TOKEN,
    storefrontApiVersion: '2025-01',
  },
});
