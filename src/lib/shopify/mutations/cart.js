import { gql } from 'graphql-request';

export const createCartAndGetCheckoutUrl = async (
  fetcher,
  lineItems,
  customerAccessToken,
  note,
  shippingAddress = null,
  buyerInfo = {}
) => {
  const lineItemsInput = lineItems.map(item => ({
    merchandiseId: item.variantId,
    quantity: item.quantity,
    attributes: item.customAttributes,
    sellingPlanId: item.sellingPlanId,
  }));

  const buyerIdentity = {};

  if (customerAccessToken) {
    buyerIdentity.customerAccessToken = customerAccessToken;
  }

  if (buyerInfo.email) {
    buyerIdentity.email = buyerInfo.email;
  }

  if (buyerInfo.phone) {
    buyerIdentity.phone = buyerInfo.phone;
  }

  if (shippingAddress?.countryCode) {
    buyerIdentity.countryCode = shippingAddress.countryCode;
  }

  const cartInput = {
    lines: lineItemsInput,
  };

  if (shippingAddress) {
    const deliveryAddressInput = {
      address: {
        deliveryAddress: {
          address1: shippingAddress.address1,
          address2: shippingAddress.address2 || null,
          city: shippingAddress.city,
          company: shippingAddress.company || null,
          countryCode: shippingAddress.countryCode || null,
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          phone: shippingAddress.phone || null,
          provinceCode: shippingAddress.provinceCode || null,
          zip: shippingAddress.zip || null,
        },
      },
      oneTimeUse: true,
      selected: true,
    };

    cartInput.delivery = {
      addresses: [deliveryAddressInput],
    };
  }

  if (Object.keys(buyerIdentity).length > 0) {
    cartInput.buyerIdentity = buyerIdentity;
  }

  if (note && note.trim().length > 0) {
    cartInput.note = note.trim();
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
