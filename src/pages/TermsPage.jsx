import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';

const TermsPage = () => {
  return (
    <>
      <Helmet>
        <title>Terms of Service - B2 Goalkeeping</title>
        <meta name="description" content="Read the Terms of Service for using the B2 Goalkeeping website and purchasing our products." />
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
              Terms of Service
            </h1>
            <div className="prose prose-invert prose-lg text-gray-300 mx-auto space-y-6">
              <h2 className="text-2xl font-semibold text-green-400">1. Agreement to Terms</h2>
              <p>By accessing or using our website, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you may not access the service.</p>
              
              <h2 className="text-2xl font-semibold text-green-400">2. Use of the Website</h2>
              <p>You are granted a limited license to access and make personal use of this website. This license does not include any resale or commercial use of this site or its contents.</p>
              
              <h2 className="text-2xl font-semibold text-green-400">3. Products and Pricing</h2>
              <p>All descriptions of products or product pricing are subject to change at any time without notice, at our sole discretion. We reserve the right to discontinue any product at any time.</p>

              <h2 className="text-2xl font-semibold text-green-400">4. Intellectual Property</h2>
              <p>All content included on this site, such as text, graphics, logos, and images, is the property of B2 Goalkeeping or its content suppliers and protected by international copyright laws.</p>
              
              <h2 className="text-2xl font-semibold text-green-400">5. Governing Law</h2>
              <p>These Terms of Service and any separate agreements whereby we provide you services shall be governed by and construed in accordance with the laws of our jurisdiction.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default TermsPage;