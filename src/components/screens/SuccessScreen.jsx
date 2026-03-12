import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, ExternalLink, RefreshCw, Github } from 'lucide-react'
import Button from '../ui/Button'

export default function SuccessScreen({ repoUrl, onDone }) {
  // Screen transition variants
  const screenVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.1 }
  }

  // Repo link open karne ke liye
  const handleOpenRepo = () => {
    window.open(repoUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <motion.div
      variants={screenVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="p-6 h-full flex flex-col justify-center items-center text-center w-full"
    >
      {/* Success Icon with pop animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
        className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-8 relative"
      >
        <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping opacity-25"></div>
        <CheckCircle2 className="w-12 h-12 text-green-500 relative z-10" />
      </motion.div>

      <h2 className="text-3xl font-bold mb-3 tracking-tight">Mission Accomplished!</h2>
      <p className="text-textSecondary text-sm mb-10 px-6 leading-relaxed">
        Your folders and files are now live on GitHub. No codespaces, no terminal, just pure magic.
      </p>

      {/* Repo Link Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full bg-surfaceHighlight border border-border p-4 rounded-2xl mb-8 flex items-center justify-between"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <Github className="w-5 h-5 text-textSecondary flex-shrink-0" />
          <span className="text-xs font-mono text-primary truncate">
            {repoUrl.replace('https://', '')}
          </span>
        </div>
        <button 
          onClick={handleOpenRepo}
          className="p-2 bg-primary/10 rounded-lg text-primary active:scale-90 transition-all"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Action Buttons */}
      <div className="w-full flex flex-col gap-3">
        <Button onClick={handleOpenRepo}>
          Open Repository
        </Button>
        <Button variant="secondary" onClick={onDone}>
          <RefreshCw className="w-4 h-4" />
          Upload Another
        </Button>
      </div>

      <p className="mt-8 text-[10px] text-textSecondary opacity-40 uppercase tracking-widest font-bold">
        Built by Jitu Banna • JSS Originals
      </p>
    </motion.div>
  )
}
