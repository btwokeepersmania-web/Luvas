import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';

const PrivacyPolicyPage = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - B2 Goalkeeping</title>
        <meta name="description" content="Read our Privacy Policy to understand how we collect, use, and protect your personal information." />
      </Helmet>
      <div className="bg-black text-white min-h-screen">
        <div className="container mx-auto px-4 py-24 sm:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center gradient-text">
              Privacy Policy
            </h1>
            <div className="prose prose-invert prose-lg text-gray-300 mx-auto space-y-6">
              <h2 className="text-2xl font-semibold text-green-400">1. Information We Collect</h2>
              <p>We collect information you provide directly to us, such as when you create an account, place an order, or contact customer service. This may include your name, email address, shipping address, and payment information.</p>
              
              <h2 className="text-2xl font-semibold text-green-400">2. How We Use Your Information</h2>
              <p>We use the information we collect to process your orders, communicate with you, and improve our services. We may also use your information to send you promotional materials, from which you can opt-out at any time.</p>
              
              <h2 className="text-2xl font-semibold text-green-400">3. Information Sharing</h2>
              <p>We do not sell or rent your personal information to third parties. We may share your information with trusted partners who assist us in operating our website, conducting our business, or servicing you, so long as those parties agree to keep this information confidential.</p>

              <h2 className="text-2xl font-semibold text-green-400">4. Data Security</h2>
              <p>We implement a variety of security measures to maintain the safety of your personal information. Your personal information is contained behind secured networks and is only accessible by a limited number of persons who have special access rights to such systems.</p>
              
              <h2 className="text-2xl font-semibold text-green-400">5. Contact Us</h2>
              <p>
                If you have any questions regarding this privacy policy, you may contact us at{' '}
                <a href="mailto:support@b2goalkeeping.com" className="text-green-400 hover:underline">
                  support@b2goalkeeping.com
                </a>
                .
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicyPage;