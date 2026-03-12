import React from 'react'
import { motion } from 'framer-motion'
import { Github } from 'lucide-react'
import ProgressBar from '../ui/ProgressBar'

export default function ProcessingScreen({ statusMessage, progress }) {
  // Screen transition animation - smooth zoom in/out
  const screenVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 }
  }

  return (
    <motion.div
      variants={screenVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="p-6 h-full flex flex-col justify-center items-center text-center w-full"
    >
      {/* Animated Pulsing GitHub Icon */}
      <motion.div
        animate={{
          boxShadow: [
            "0px 0px 0px 0px rgba(10, 132, 255, 0.2)", 
            "0px 0px 0px 25px rgba(10, 132, 255, 0)", 
            "0px 0px 0px 0px rgba(10, 132, 255, 0)"
          ]
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="w-20 h-20 bg-surfaceHighlight rounded-full flex items-center justify-center mb-8 shadow-glass relative"
      >
        <Github className="w-10 h-10 text-primary relative z-10" />
      </motion.div>

      <h2 className="text-2xl font-bold mb-2 tracking-tight">Pushing to GitHub</h2>
      <p className="text-textSecondary text-sm mb-12 px-4 leading-relaxed">
        Please keep the app open. We are building your repository tree and uploading files.
      </p>

      {/* Upload Progress Bar Component */}
      <div className="w-full max-w-[280px]">
        <ProgressBar progress={progress} message={statusMessage} />
      </div>
      
    </motion.div>
  )
}
