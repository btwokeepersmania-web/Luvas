import { gql } from 'graphql-request';

export const customerCreate = async (fetcher, input) => {
  const mutation = gql`
    mutation customerCreate($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer {
          id
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;
  return await fetcher(mutation, { input });
};

export const customerAccessTokenCreate = async (fetcher, input) => {
  const mutation = gql`
    mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken {
          accessToken
          expiresAt
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;
  return await fetcher(mutation, { input });
};

export const customerAccessTokenDelete = async (fetcher, customerAccessToken) => {
  const mutation = gql`
    mutation customerAccessTokenDelete($customerAccessToken: String!) {
      customerAccessTokenDelete(customerAccessToken: $customerAccessToken) {
        deletedAccessToken
        userErrors {
          field
          message
        }
      }
    }
  `;
  return await fetcher(mutation, { customerAccessToken });
};


const generateSecurePassword = () => {
  const length = 16;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let retVal = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
};

export const subscribeToEmailMarketing = async (fetcher, email) => {
  const mutation = gql`
    mutation customerCreate($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer {
          id
          email
          acceptsMarketing
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const input = {
    email: email,
    password: generateSecurePassword(),
    acceptsMarketing: true,
  };

  try {
    const data = await fetcher(mutation, { input });
    const userErrors = data.customerCreate?.userErrors || [];
    
    const emailTakenError = userErrors.find(error => error.message.includes("Email has already been taken"));
    
    if (userErrors.length > 0 && !emailTakenError) {
      throw new Error(userErrors.map(e => e.message).join(', '));
    }
    
    if (emailTakenError) {
      return { message: "Email has already been taken" };
    }

    return data.customerCreate?.customer;
  } catch (error) {
    console.error('Email subscription error:', error);
    throw error;
  }
};