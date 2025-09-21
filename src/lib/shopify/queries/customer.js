import { gql } from 'graphql-request';

export const getCustomer = async (client, customerAccessToken) => {
  const query = gql`
    query getCustomer($customerAccessToken: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
      customer(customerAccessToken: $customerAccessToken) {
        id
        firstName
        lastName
        displayName
        email
        phone
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
  
  return await client.request(query, { customerAccessToken });
};