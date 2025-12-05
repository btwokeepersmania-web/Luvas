import { gql } from 'graphql-request';

export const fetchShopInfo = async (fetcher) => {
  const query = gql`
    query getShopInfo($country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
      shop {
        name
        description
        brand {
          logo {
            image {
              url
              altText
            }
          }
        }
      }
    }
  `;
  const data = await fetcher(query);
  return data.shop;
};