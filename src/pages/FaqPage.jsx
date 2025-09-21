import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';

const FaqPage = () => {
  const faqs = [
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (VISA, Mastercard, AMEX), PayPal, and other secure payment methods. All transactions are encrypted for your safety.',
    },
    {
      question: 'How can I track my order?',
      answer: 'Once your order is shipped, you will receive an email with a tracking number and a link to the carrier\'s website. You can also track your order status in the "My Account" section if you have created an account.',
    },
    {
      question: 'What is your return policy?',
      answer: 'We offer a 30-day return policy for unused items in their original packaging. Please visit our Return Policy page for more details on how to initiate a return.',
    },
    {
      question: 'How do I choose the right glove size?',
      answer: 'We have a comprehensive size guide available on each product page. We recommend measuring your hand and consulting the chart to find your perfect fit for maximum comfort and performance.',
    },
    {
      question: 'Do you ship internationally?',
      answer: 'Yes, we ship to most countries worldwide. Shipping costs and delivery times vary depending on the destination. You can see the final shipping costs at checkout.',
    },
  ];

  return (
    <>
      <Helmet>
        <title>FAQ - B2 Goalkeeping</title>
        <meta name="description" content="Find answers to frequently asked questions about our products, shipping, returns, and more." />
      </Helmet>
      <div className="bg-gray-950 text-white min-h-screen">
        <div className="container mx-auto px-4 py-24 sm:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-300">
              Have questions? We have answers.
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-900 border border-yellow-500/20 rounded-lg p-6"
              >
                <h2 className="text-xl font-semibold text-yellow-400 mb-2">{faq.question}</h2>
                <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default FaqPage;