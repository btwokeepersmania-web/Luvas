import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';

const ReturnPolicyPage = () => {
  return (
    <>
      <Helmet>
        <title>Return Policy - B2 Goalkeeping</title>
        <meta name="description" content="Learn about our return and exchange policy for all B2 Goalkeeping products." />
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
              Return Policy
            </h1>
            <div className="prose prose-invert prose-lg text-gray-300 mx-auto space-y-6">
              <p>We want you to be completely satisfied with your purchase. If you are not happy with your product, you may return it within 30 days of the delivery date for a full refund or exchange.</p>
              
              <h2 className="text-2xl font-semibold text-green-400">Conditions for Return</h2>
              <ul>
                <li>Items must be in new, unused condition.</li>
                <li>Items must be returned with all original packaging and tags attached.</li>
                <li>Personalized items are not eligible for returns unless there is a manufacturing defect.</li>
                <li>Proof of purchase is required for all returns.</li>
              </ul>

              <h2 className="text-2xl font-semibold text-green-400">How to Initiate a Return</h2>
              <p>
                To start a return, please contact our customer support team at{' '}
                <a href="mailto:support@b2goalkeeping.com" className="text-green-400 hover:underline">
                  support@b2goalkeeping.com
                </a>
                {' '}with your order number and reason for the return.
              </p>
              
              <h2 className="text-2xl font-semibold text-green-400">Refunds</h2>
              <p>Once we receive and inspect your returned item, we will process your refund. The refund will be credited to your original method of payment within 5-7 business days.</p>
              
              <h2 className="text-2xl font-semibold text-green-400">Exchanges</h2>
              <p>If you would like to exchange an item for a different size or color, please contact us to arrange the exchange. Exchanges are subject to product availability.</p>

              <p>Please note that original shipping charges are non-refundable.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ReturnPolicyPage;