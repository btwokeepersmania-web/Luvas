import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useCart } from '@/context/CartContext.jsx';

const FallingLetter = ({ char, i }) => {
  return (
    <motion.span
      initial={{ y: -200, opacity: 0, rotate: -30 }}
      animate={{ y: 0, opacity: 1, rotate: 0 }}
      transition={{ delay: i * 0.06, type: 'spring', stiffness: 80, damping: 12 }}
      style={{ display: 'inline-block', willChange: 'transform' }}
      className="inline-block text-6xl md:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-yellow-300 to-pink-400"
    >
      {char}
    </motion.span>
  );
};

const Confetti = () => {
  // Pure CSS confetti elements
  const pieces = Array.from({ length: 24 }).map((_, i) => ({ id: i }));
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {pieces.map((p, idx) => (
        <div
          key={p.id}
          className="absolute w-2 h-4 rounded-sm"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${-10 - Math.random() * 10}%`,
            background: `hsl(${Math.floor(Math.random() * 360)}deg 80% 60%)`,
            transform: `rotate(${Math.floor(Math.random() * 360)}deg)`,
            animation: `confetti-fall ${3 + Math.random() * 3}s linear ${Math.random() * 0.5}s both`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

const ThankYouPage = () => {
  const { clearCart, cartItems } = useCart();
  const navigate = useNavigate();

  // Simple tracking: push to dataLayer and call gtag if present
  const trackPurchase = () => {
    try {
      const purchaseData = {
        event: 'purchase',
        total: cartItems?.reduce((s, it) => s + (parseFloat(it.price) || 0) * it.quantity, 0),
        items: cartItems || [],
      };

      if (window.dataLayer && Array.isArray(window.dataLayer)) {
        window.dataLayer.push(purchaseData);
      }

      if (typeof window.gtag === 'function') {
        window.gtag('event', 'purchase', {
          value: purchaseData.total,
          currency: cartItems?.[0]?.currency || 'BRL',
          items: purchaseData.items.map(i => ({ id: i.variantId || i.productId, name: i.title, quantity: i.quantity })),
        });
      }
    } catch (err) {
      // swallow tracking errors
      // eslint-disable-next-line no-console
      console.error('Tracking error', err);
    }
  };

  useEffect(() => {
    // Clear local cart and run tracking once on mount
    try {
      trackPurchase();
    } finally {
      clearCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title = 'Obrigado pela sua compra!';
  const subtitle = 'Seu pedido foi processado com sucesso.';
  const letters = Array.from(title);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-950 to-black px-4 py-20">
      <Helmet>
        <title>Obrigado — B2 Goalkeeping</title>
      </Helmet>

      <Confetti />

      <div className="max-w-3xl w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center space-x-2 mb-6">
            {letters.map((ch, i) => (
              <FallingLetter key={`${ch}-${i}`} char={ch === ' ' ? '\u00A0' : ch} i={i} />
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: letters.length * 0.06 + 0.2 }}
            className="text-gray-300 text-lg md:text-xl"
          >
            {subtitle}
          </motion.p>
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: letters.length * 0.06 + 0.35, type: 'spring', stiffness: 80 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8"
        >
          <button
            onClick={() => navigate('/')}
            className="bg-green-500 hover:bg-green-600 text-black font-bold px-6 py-3 rounded-lg shadow-lg"
          >
            Continuar comprando
          </button>

          <button
            onClick={() => navigate('/account')}
            className="bg-transparent border border-gray-700 hover:border-gray-600 text-gray-200 px-6 py-3 rounded-lg"
          >
            Ver minha conta
          </button>
        </motion.div>

        <p className="text-xs text-gray-500 mt-6">Você será redirecionado em breve...</p>
      </div>

      <style>{`
        /* Small responsive tweaks for the falling letters */
        @media (max-width: 640px) {
          .text-6xl { font-size: 2.25rem; }
        }
      `}</style>
    </div>
  );
};

export default ThankYouPage;
