import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils.js';

const AnimatedGradientText = ({ 
  children, 
  className = '', 
  as: Component = 'h2',
  delay = 0,
  ...props 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: delay,
        ease: "easeOut"
      }}
      viewport={{ once: true, margin: "-100px" }}
      className="relative overflow-hidden"
    >
      <Component
        className={cn(
          "relative bg-clip-text text-transparent font-extrabold",
          className
        )}
        style={{
          backgroundImage: 'linear-gradient(90deg, #34D399, #10B981, #FBBF24, #F97316)',
          backgroundSize: '300% 100%',
          animation: 'gradientX 4s linear infinite'
        }}
        {...props}
      >
        {children}
      </Component>

      {/* Softer animated shine */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.12, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          delay: delay
        }}
        style={{
          background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0) 100%)',
          mixBlendMode: 'overlay'
        }}
      />
    </motion.div>
  );
};

export default AnimatedGradientText;
