import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Toaster } from '@/components/ui/toaster.jsx';
import { ShopifyProvider } from '@/context/ShopifyContext.jsx';
import { CartProvider } from '@/context/CartContext.jsx';
import { LocalizationProvider } from '@/context/LocalizationContext.jsx';
import { AuthProvider } from '@/context/AuthContext.jsx';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';

// Helper to make dynamic imports resilient — logs and returns a fallback UI instead of failing.
const safeLazy = (importFn, name) => lazy(() =>
  importFn().catch((err) => {
    console.error(`Dynamic import failed for ${name || 'module'}`, err);
    return {
      default: () => (
        <div className="p-8 text-center">
          <h3 className="text-red-400">Failed to load component</h3>
          <p className="text-gray-300">Please refresh the page or try again later.</p>
        </div>
      )
    };
  })
);

const HomePage = safeLazy(() => import('@/pages/HomePage.jsx'), 'HomePage');
const ProductPage = safeLazy(() => import('@/pages/ProductPage.jsx'), 'ProductPage');
const ShopPage = safeLazy(() => import('@/pages/ShopPage.jsx'), 'ShopPage');
const CollectionPage = safeLazy(() => import('@/pages/CollectionPage.jsx'), 'CollectionPage');
import ScrollToTop from '@/components/ScrollToTop.jsx';
const PolicyPage = safeLazy(() => import('@/pages/PolicyPage.jsx'), 'PolicyPage');
const ContactPage = safeLazy(() => import('@/pages/ContactPage.jsx'), 'ContactPage');
const AboutPage = safeLazy(() => import('@/pages/AboutPage.jsx'), 'AboutPage');
const FaqPage = safeLazy(() => import('@/pages/FaqPage.jsx'), 'FaqPage');
const ReturnPolicyPage = safeLazy(() => import('@/pages/ReturnPolicyPage.jsx'), 'ReturnPolicyPage');
const TermsPage = safeLazy(() => import('@/pages/TermsPage.jsx'), 'TermsPage');
const PrivacyPolicyPage = safeLazy(() => import('@/pages/PrivacyPolicyPage.jsx'), 'PrivacyPolicyPage');
const LoginPage = safeLazy(() => import('@/pages/LoginPage.jsx'), 'LoginPage');
const RegisterPage = safeLazy(() => import('@/pages/RegisterPage.jsx'), 'RegisterPage');
const AuthCallbackPage = safeLazy(() => import('@/pages/AuthCallbackPage.jsx'), 'AuthCallbackPage');
const ThankYouPage = safeLazy(() => import('@/pages/ThankYouPage.jsx'), 'ThankYouPage');
const CareInstructionsPage = safeLazy(() => import('@/pages/CareInstructionsPage.jsx'), 'CareInstructionsPage');
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import { useShopify } from '@/context/ShopifyContext.jsx';
import AccountLayout from '@/components/AccountLayout.jsx';
import AccountProfile from '@/components/AccountProfile.jsx';
import AccountOrders from '@/components/AccountOrders.jsx';
import AccountSettings from '@/components/AccountSettings.jsx';
import AccountAddresses from '@/components/AccountAddresses.jsx';
import SuggestionsModal from '@/components/SuggestionsModal.jsx';
import WhatsAppChat from '@/components/WhatsAppChat.jsx';
import CareFloatingCTA from '@/components/CareFloatingCTA.jsx';
import ComingSoonPage from '@/pages/ComingSoonPage.jsx';

const AppContent = () => {
  const location = useLocation();
  const { shopInfo } = useShopify();
  const siteTitle = shopInfo?.name || 'B2 Goalkeeping';
  const siteDescription = shopInfo?.description || 'Discover the best goalkeeper gloves for professional performance. B2 Goalkeeping offers high-quality equipment for goalkeepers of all levels.';
  const fallbackLogoUrl = "https://horizons-cdn.hostinger.com/0afbbc13-3f79-4ef4-9a3d-7ced931377ec/d4652c1a1b839e3511e69b94bb6581f9.png";
  const faviconUrl = shopInfo?.brand?.logo?.image?.url || fallbackLogoUrl;

  // Check for coming soon mode (supports VITE_ and PUBLIC_)
  const comingSoon = (import.meta.env.VITE_COMING_SOON_MODE ?? import.meta.env.PUBLIC_COMING_SOON_MODE) === 'true';
  if (comingSoon) {
    return <ComingSoonPage />;
  }

  return (
    <>
      <Helmet>
        <title>{`${siteTitle} - Professional Goalkeeper Gloves`}</title>
        <meta name="description" content={siteDescription} />
        <meta property="og:title" content={`${siteTitle} - Professional Goalkeeper Gloves`} />
        <meta property="og:description" content={siteDescription} />
        <meta property="og:type" content="website" />
        {faviconUrl && <link rel="icon" href={faviconUrl} />}

        {/* Performance: preconnect to fonts and CDNs used */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </Helmet>
      
      <ScrollToTop />
      <Header />
      <main className="min-h-screen bg-gray-950 text-white selection:bg-yellow-400 selection:text-black overflow-x-hidden">
        <ErrorBoundary>
          <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<HomePage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/products/:handle" element={<ProductPage />} />
              <Route path="/collections/:handle" element={<CollectionPage />} />
              <Route path="/pages/:handle" element={<PolicyPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/return-policy" element={<ReturnPolicyPage />} />
              <Route path="/terms-of-service" element={<TermsPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/account/login" element={<LoginPage />} />
              <Route path="/account/register" element={<RegisterPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/care" element={<CareInstructionsPage />} />
              <Route path="/obrigado" element={<ThankYouPage />} />
              <Route path="/account" element={<ProtectedRoute><AccountLayout /></ProtectedRoute>}>
                <Route index element={<AccountOrders />} />
                <Route path="profile" element={<AccountProfile />} />
                <Route path="orders" element={<AccountOrders />} />
                <Route path="addresses" element={<AccountAddresses />} />
                <Route path="settings" element={<AccountSettings />} />
              </Route>
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <Toaster />
      <SuggestionsModal />
      <WhatsAppChat />
      {(location.pathname.startsWith('/products') || location.pathname === '/about') && <CareFloatingCTA />}
    </>
  );
};

function App() {
  return (
    <LocalizationProvider>
      <ShopifyProvider>
        <CartProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </CartProvider>
      </ShopifyProvider>
    </LocalizationProvider>
  );
}

export default App;
