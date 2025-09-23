import { gql } from 'graphql-request';
import { formatCollection, formatCollections, formatProducts } from '../formatters.js';

const HIDDEN_HANDLES = [
  'optionize-add-ons',
  'hydrogen',
  'optionize-number-199',
  'optionize-glove-id-199'
];

export const fetchCollections = async (fetcher) => {
  const query = gql`
    query getCollections($first: Int!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
      collections(first: $first, sortKey: RELEVANCE) {
        edges {
          node {
            id
            title
            handle
            description
            image { url altText }
          }
        }
      }
    }
  `;
  const data = await fetcher(query, { first: 10 });
  if (!data || !data.collections || !Array.isArray(data.collections.edges)) return [];
  const filteredEdges = data.collections.edges.filter(({ node }) => !HIDDEN_HANDLES.includes(node.handle));
  return formatCollections(filteredEdges);
};

export const fetchCollectionByHandle = async (fetcher, handle) => {
  const query = gql`
    query getCollectionByHandle($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
      collection(handle: $handle) {
        id
        title
        description
        handle
        image { url altText }
      }
    }
  `;
  const data = await fetcher(query, { handle });
  if (!data || !data.collection) return null;
  return formatCollection(data.collection);
};

export const fetchCollectionProducts = async (fetcher, collectionId) => {
  const query = gql`
    query getCollectionProducts($id: ID!, $first: Int!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
      collection(id: $id) {
        products(first: $first) {
          edges {
            node {
              id
              title
              handle
              description
              productType
              images(first: 5) { edges { node { url altText } } }
              options { name values }
              variants(first: 250) {
                edges {
                  node {
                    id
                    title
                    availableForSale
                    quantityAvailable
                    price { amount currencyCode }
                    compareAtPrice { amount currencyCode }
                    image { id url altText }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
  const data = await fetcher(query, { id: collectionId, first: 250 });
  if (data && data.collection && Array.isArray(data.collection.products?.edges)) {
    const filteredEdges = data.collection.products.edges.filter(({ node }) => !HIDDEN_HANDLES.includes(node.handle));
    return formatProducts(filteredEdges);
  }
  return [];
};
