import React from 'react';
import { motion } from 'framer-motion';

export default function GlassCard({ 
  children, 
  className = '', 
  hoverEffect = false,
  glow = false,
  onClick,
  ...props 
}) {
  const baseClasses = hoverEffect 
    ? 'glass-panel-interactive rounded-2xl p-6 relative overflow-hidden' 
    : 'glass-panel rounded-2xl p-6 relative overflow-hidden';
  
  const glowClasses = glow ? 'glow-box border-opacity-40 border-brandPlatinum' : '';

  return (
    <motion.div 
      className={`${baseClasses} ${glowClasses} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
}
