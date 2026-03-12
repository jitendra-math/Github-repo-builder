import React from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export default function Button({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  className = '', 
  disabled, 
  ...props 
}) {
  // Mobile-first base styling (Bade tap targets ke liye padding zyada rakhi hai)
  const baseStyles = "w-full flex items-center justify-center gap-2 font-semibold rounded-2xl py-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  
  // Alag-alag themes ke liye variants
  const variants = {
    primary: "bg-primary text-white",
    secondary: "bg-surfaceHighlight text-white border border-border",
    danger: "bg-red-500/10 text-red-500",
    ghost: "bg-transparent text-textSecondary"
  }

  return (
    <motion.button
      // Agar button disabled ya loading state mein hai, toh tap animation nahi hoga
      whileTap={disabled || isLoading ? {} : { scale: 0.96 }}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        children
      )}
    </motion.button>
  )
}
