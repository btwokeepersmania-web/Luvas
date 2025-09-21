import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GraphQLClient, gql } from 'graphql-request';

const LocalizationContext = createContext();

const SHOPIFY_DOMAIN = import.meta.env.VITE_SHOPIFY_DOMAIN;
const STOREFRONT_ACCESS_TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const API_VERSION = import.meta.env.VITE_SHOPIFY_API_VERSION;

const createClient = () => {
  if (!SHOPIFY_DOMAIN || !STOREFRONT_ACCESS_TOKEN || !API_VERSION) return null;
  const endpoint = `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`;
  return new GraphQLClient(endpoint, {
    headers: {
      'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN,
    },
  });
};

export const useLocalization = () => {
  return useContext(LocalizationContext);
};

export const LocalizationProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [localization, setLocalization] = useState(null);
  const [country, setCountry] = useState(null);
  const [language, setLanguage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocalization = async () => {
      const client = createClient();
      if (!client) {
        setLoading(false);
        return;
      }
      const query = gql`
        query localization {
          localization {
            availableCountries {
              isoCode
              name
              currency {
                isoCode
                name
                symbol
              }
              availableLanguages {
                isoCode
                name
              }
            }
          }
        }
      `;

      try {
        const data = await client.request(query);
        setLocalization(data.localization);

        // Determine initial country: respect saved preference, else detect from browser, else default to GB (United Kingdom)
        const savedCountryCode = localStorage.getItem('b2g-country');
        let preferredCountryCode = 'GB';
        if (savedCountryCode) {
          preferredCountryCode = savedCountryCode;
        } else if (typeof navigator !== 'undefined') {
          const navLang = (navigator.languages && navigator.languages[0]) || navigator.language || '';
          // navLang typically 'en-GB' or 'en-US' or 'pt-BR' etc
          if (navLang.includes('GB') || navLang.toLowerCase().includes('en-gb')) {
            preferredCountryCode = 'GB';
          } else if (navLang.includes('US') || navLang.toLowerCase().includes('en-us')) {
            preferredCountryCode = 'US';
          } else {
            // fallback to GB for this store
            preferredCountryCode = 'GB';
          }
        }

        let initialCountry = data.localization.availableCountries.find(c => c.isoCode === preferredCountryCode);
        if (!initialCountry) {
          initialCountry = data.localization.availableCountries[0];
        }
        setCountry(initialCountry);

        let initialLanguage = initialCountry.availableLanguages.find(l => l.isoCode.toLowerCase() === i18n.language.toLowerCase());
        if (!initialLanguage) {
          // prefer English if available
          initialLanguage = initialCountry.availableLanguages.find(l => l.isoCode.toLowerCase().startsWith('en')) || initialCountry.availableLanguages[0];
        }
        setLanguage(initialLanguage);
        i18n.changeLanguage(initialLanguage.isoCode.toLowerCase());

      } catch (error) {
        console.error("Failed to fetch localization:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLocalization();
  }, []);

  useEffect(() => {
    if (country) {
      localStorage.setItem('b2g-country', country.isoCode);
      
      const newLanguage = country.availableLanguages.find(l => l.isoCode.toLowerCase() === i18n.language.toLowerCase()) || country.availableLanguages[0];
      setLanguage(newLanguage);
      i18n.changeLanguage(newLanguage.isoCode.toLowerCase());
    }
  }, [country, i18n.language]);
  
  const setCountryAndLanguage = (countryCode, languageCode) => {
    const newCountry = localization.availableCountries.find(c => c.isoCode === countryCode);
    if(newCountry) {
      setCountry(newCountry);
      const newLanguage = newCountry.availableLanguages.find(l => l.isoCode === languageCode) || newCountry.availableLanguages[0];
      setLanguage(newLanguage);
      i18n.changeLanguage(newLanguage.isoCode.toLowerCase());
    }
  }

  const value = {
    loading,
    localization,
    country,
    language,
    setCountry,
    setLanguage: (lang) => {
      setLanguage(lang);
      i18n.changeLanguage(lang.isoCode.toLowerCase());
    },
    setCountryAndLanguage,
    formatPrice: (price, currencyCode, locale) => {
      if (!price && price !== 0) return '';
      const fallbackLocale = locale || (language?.isoCode ? (language.isoCode === 'en' ? 'en-GB' : `${language.isoCode}-GB`) : 'en-GB');
      const fallbackCurrency = currencyCode || country?.currency?.isoCode || 'GBP';
      try {
        return new Intl.NumberFormat(fallbackLocale, {
          style: 'currency',
          currency: fallbackCurrency,
        }).format(parseFloat(price));
      } catch (e) {
        // fallback safe formatting
        return `${fallbackCurrency} ${parseFloat(price).toFixed(2)}`;
      }
    }
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};
