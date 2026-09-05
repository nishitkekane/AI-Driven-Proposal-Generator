import React from 'react';
import { motion } from 'framer-motion';

export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className={`${sizeMap[size] || sizeMap.md} rounded-full border-[#E5E4E2]/20 border-t-[#E5E4E2]`}
      />
      {text && (
        <p className="text-xs font-medium text-[#E5E4E2]/70 animate-pulse tracking-wider uppercase">
          {text}
        </p>
      )}
    </div>
  );
}
