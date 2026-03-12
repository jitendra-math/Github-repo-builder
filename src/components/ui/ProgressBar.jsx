import React from 'react'
import { motion } from 'framer-motion'

export default function ProgressBar({ progress = 0, message = 'Processing...' }) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100)

  return (
    <div className="w-full flex flex-col items-center">
      <p className="text-sm text-textSecondary mb-3 font-medium animate-pulse">
        {message}
      </p>
      <div className="w-full h-2 bg-surfaceHighlight rounded-full overflow-hidden shadow-inner">
        <motion.div 
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ ease: "easeInOut", duration: 0.3 }}
        />
      </div>
      <p className="text-xs text-textSecondary mt-2 font-mono">
        {Math.round(clampedProgress)}%
      </p>
    </div>
  )
}
