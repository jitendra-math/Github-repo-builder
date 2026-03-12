import React from 'react'
import { motion } from 'framer-motion'
import { Github } from 'lucide-react'
import Input from '../ui/Input'
import Button from '../ui/Button'

export default function SetupScreen({ token, setToken, onSave }) {
  // Form submit handle karne ke liye
  const handleSubmit = (e) => {
    e.preventDefault()
    if (token.trim().length > 10) {
      onSave(token)
    }
  }

  // Smooth Screen Transitions
  const screenVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  }

  return (
    <motion.div
      variants={screenVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="p-6 h-full flex flex-col justify-center items-center text-center w-full"
    >
      {/* Animated Logo Icon */}
      <motion.div 
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 10 }}
        className="w-16 h-16 bg-surfaceHighlight rounded-full flex items-center justify-center mb-6 shadow-glass"
      >
        <Github className="w-8 h-8 text-primary" />
      </motion.div>

      <h1 className="text-2xl font-bold mb-2 tracking-tight">Connect GitHub</h1>
      <p className="text-textSecondary mb-8 text-sm">
        Paste your Personal Access Token to continue.
      </p>

      {/* Main Form (Ab humare custom Input aur Button ke sath) */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2">
        <Input
          type="password"
          placeholder="ghp_xxxxxxxxxxxx..."
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
        />
        <Button 
          type="submit" 
          disabled={!token.trim()} // Jab tak token na daale, button disabled rahega
        >
          Save & Continue
        </Button>
      </form>
      
      {/* Trust indicator */}
      <div className="mt-8 text-xs text-textSecondary opacity-60 font-medium">
        <p>Your token is safely stored locally on your device.</p>
      </div>
    </motion.div>
  )
}
