import { gql } from 'graphql-request';

export const fetchPolicy = async (fetcher, handle) => {
  const query = gql`
    query getPolicy($country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
      shop {
        shopPolicies {
          type
          title
          handle
          body
        }
      }
    }
  `;
  const data = await fetcher(query);
  const policy = data.shop.shopPolicies.find(p => p.handle === handle);
  return policy ? { title: policy.title, body: policy.body } : null;
};