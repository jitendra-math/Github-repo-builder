import React from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, FolderGit2, FileCode, PackageOpen } from 'lucide-react'
import Button from '../ui/Button'

export default function PreviewScreen({ repoName, extractedFiles, onConfirm, onBack }) {
  // Screen transition animations
  const screenVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  }

  return (
    <motion.div
      variants={screenVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="p-6 h-full flex flex-col w-full"
    >
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-8 mt-4">
        <button 
          onClick={onBack}
          className="p-2 bg-surfaceHighlight rounded-full text-textPrimary active:scale-90 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold tracking-tight">Review Tree</h2>
      </div>

      {/* Repo Name Info Card */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6 flex items-center gap-4">
        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
          <PackageOpen className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Target Repository</p>
          <p className="text-lg font-semibold text-textPrimary truncate max-w-[200px]">{repoName}</p>
        </div>
      </div>

      {/* Full File List - Scrollable */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-3 ml-1">
          <p className="text-sm text-textSecondary font-medium">
            Files to be pushed
          </p>
          <span className="text-xs bg-surfaceHighlight px-2 py-1 rounded-md text-textSecondary">
            {extractedFiles.length} items
          </span>
        </div>

        <div className="flex-1 bg-black/40 border border-border rounded-2xl overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {extractedFiles.map((file, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }} // Staggered entry animation
                className="flex items-center gap-3 border-b border-border/30 pb-2 last:border-0"
              >
                <FileCode className="w-4 h-4 text-primary/60 flex-shrink-0" />
                <p className="text-xs font-mono text-textPrimary/90 truncate">
                  {file.path}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Final Action Button */}
      <div className="mt-6">
        <Button onClick={onConfirm}>
          <FolderGit2 className="w-5 h-5" />
          Confirm & Push to GitHub
        </Button>
      </div>

      <p className="text-[10px] text-center text-textSecondary mt-4 opacity-50 uppercase tracking-tighter">
        Final check before commit
      </p>
    </motion.div>
  )
}
