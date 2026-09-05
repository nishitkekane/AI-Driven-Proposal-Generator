import React from 'react';
import { motion } from 'framer-motion';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-xs font-semibold rounded-lg gap-1.5',
    md: 'px-6 py-3 text-sm font-semibold rounded-xl gap-2',
    lg: 'px-8 py-4 text-base font-bold rounded-xl gap-2.5',
  };

  const variants = {
    // Solid Platinum button with Deep Navy text for primary CTAs
    primary: `
      bg-[#E5E4E2] text-[#082567] shadow-lg shadow-black/20
      hover:bg-white hover:shadow-xl hover:shadow-[#E5E4E2]/20
      active:scale-95 transition-all duration-200 cursor-pointer
    `,
    // Glass border outlines with smooth hover-scale effects for secondary CTAs
    secondary: `
      bg-white/5 text-[#E5E4E2] border border-[#E5E4E2]/30 backdrop-blur-md
      hover:bg-white/10 hover:border-[#E5E4E2]/60 hover:shadow-lg hover:shadow-white/5
      active:scale-95 transition-all duration-200 cursor-pointer
    `,
    // Accent emerald variant for finalize actions
    emerald: `
      bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-900/40
      hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/20
      active:scale-95 transition-all duration-200 cursor-pointer
    `,
    // Danger/Ghost variant
    ghost: `
      text-[#E5E4E2]/70 hover:text-[#E5E4E2] hover:bg-white/5
      transition-all duration-200 cursor-pointer
    `
  };

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`
        inline-flex items-center justify-center font-medium tracking-wide
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        ${sizeClasses[size] || sizeClasses.md}
        ${variants[variant] || variants.primary}
        ${className}
      `}
      {...props}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />}
      {children}
    </motion.button>
  );
}
