import { gql } from 'graphql-request';
import { formatProduct, formatProducts } from '../formatters.js';

const HIDDEN_HANDLES = [
  'optionize-add-ons',
  'hydrogen',
  'optionize-number-199',
  'optionize-glove-id-199'
];

export const fetchProducts = async (fetcher) => {
  const query = gql`
    query getProducts($first: Int!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
      products(first: $first, sortKey: RELEVANCE) {
        edges {
          node {
            id
            title
            handle
            description
            productType
            images(first: 6) {
              edges {
                node {
                  id
                  altText
                  url(transform: { maxWidth: 1200, crop: CENTER })
                  thumbnail: url(transform: { maxWidth: 320, maxHeight: 320, crop: CENTER })
                }
              }
            }
            options { name values }
            variants(first: 20) { edges { node { id title availableForSale price { amount currencyCode } compareAtPrice { amount currencyCode } } } }
          }
        }
      }
    }
  `;
  const data = await fetcher(query, { first: 250 });
  const filteredEdges = data.products.edges.filter(({ node }) => !HIDDEN_HANDLES.includes(node.handle));
  return formatProducts(filteredEdges);
};

export const fetchProductByHandle = async (fetcher, handle) => {
  const query = gql`
    query getProductByHandle($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
      product(handle: $handle) {
        id
        title
        handle
        description
        descriptionHtml
        productType
        metafields(identifiers: [{namespace: "optionize", key: "product_options"}]) {
          key
          namespace
          value
        }
        images(first: 12) {
          edges {
            node {
              id
              altText
              url(transform: { maxWidth: 1400, crop: CENTER })
              thumbnail: url(transform: { maxWidth: 320, maxHeight: 320, crop: CENTER })
            }
          }
        }
        options(first: 3) { id name values }
        variants(first: 250) { edges { node { id title availableForSale quantityAvailable price { amount currencyCode } compareAtPrice { amount currencyCode } image { id url altText } selectedOptions { name value } } } }
      }
    }
  `;
  const data = await fetcher(query, { handle });
  return data && data.product ? formatProduct(data.product) : null;
};

export const fetchSubscriptionPlans = async (fetcher) => {
  const query = gql`
    query getSubscriptionProducts($first: Int!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
      products(first: $first, query: "tag:subscription") {
        edges {
          node {
            id
            title
            handle
            description
            featuredImage { url altText }
            sellingPlanGroups(first: 5) {
              edges {
                node {
                  appName
                  name
                  sellingPlans(first: 5) {
                    edges {
                      node {
                        id
                        name
                        description
                        options { name value }
                        priceAdjustments {
                          adjustmentValue {
                            ... on SellingPlanPriceAdjustmentValue {
                              adjustmentPercentage
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            variants(first: 1) {
              edges {
                node {
                  id
                  price { amount currencyCode }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const data = await fetcher(query, { first: 10 });
    if (!data || !data.products || !Array.isArray(data.products.edges)) return [];
    return data.products.edges.map(({ node }) => ({
      productId: node.id,
      variantId: node.variants?.edges?.[0]?.node?.id ?? null,
      title: node.title,
      description: node.description,
      image: node.featuredImage?.url ?? null,
      altText: node.featuredImage?.altText ?? null,
      price: node.variants?.edges?.[0]?.node?.price?.amount ?? null,
      currency: node.variants?.edges?.[0]?.node?.price?.currencyCode ?? null,
      sellingPlanGroups: Array.isArray(node.sellingPlanGroups?.edges) ? node.sellingPlanGroups.edges.map(groupEdge => groupEdge.node) : [],
    })).filter(product => product.sellingPlanGroups.length > 0 && product.variantId);
  } catch (error) {
    console.error("Failed to fetch subscription plans:", error);
    return [];
  }
};
