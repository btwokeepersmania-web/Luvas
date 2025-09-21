import { gql } from 'graphql-request';

export const createCartAndGetCheckoutUrl = async (fetcher, lineItems, customerAccessToken, note, shippingAddress = null) => {
  const lineItemsInput = lineItems.map(item => ({
    merchandiseId: item.variantId,
    quantity: item.quantity,
    attributes: item.customAttributes,
    sellingPlanId: item.sellingPlanId,
  }));

  const buyerIdentity = customerAccessToken ? { customerAccessToken } : {};

  // Add delivery address if provided
  if (shippingAddress) {
    buyerIdentity.deliveryAddressPreferences = [{
      deliveryAddress: {
        address1: shippingAddress.address1,
        address2: shippingAddress.address2 || null,
        city: shippingAddress.city,
        company: shippingAddress.company || null,
        country: shippingAddress.country,
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        phone: shippingAddress.phone || null,
        province: shippingAddress.province || null,
        zip: shippingAddress.zip || null,
      }
    }];
  }

  const cartInput = {
    lines: lineItemsInput,
    buyerIdentity,
  };

  if (note) {
    cartInput.note = note;
  }

  const mutation = gql`
    mutation cartCreate($input: CartInput!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  const variables = { input: cartInput };
  const data = await fetcher(mutation, variables);

  if (data.cartCreate.userErrors?.length > 0) {
    throw new Error(data.cartCreate.userErrors.map(e => e.message).join(', '));
  }
  if (!data.cartCreate.cart?.checkoutUrl) {
    throw new Error("Falha ao criar o carrinho ou obter a URL de checkout.");
  }
  return data.cartCreate.cart.checkoutUrl;
};
