import React from 'react'

export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="w-full flex flex-col mb-4">
      {/* Agar label pass kiya hai toh render hoga */}
      {label && (
        <label className="text-sm text-textSecondary mb-2 ml-1 font-medium">
          {label}
        </label>
      )}
      
      {/* Main Input Field - Apple-like rounded corners aur smooth focus transition */}
      <input
        className={`
          w-full bg-black border rounded-2xl px-4 py-4 text-white 
          placeholder:text-textSecondary/50 
          focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary 
          transition-all duration-200
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-border'} 
          ${className}
        `}
        {...props}
      />
      
      {/* Agar koi validation error hai toh input ke neeche red color mein dikhega */}
      {error && (
        <span className="text-xs text-red-500 mt-1 ml-1">{error}</span>
      )}
    </div>
  )
}
