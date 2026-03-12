import React from 'react'

export default function MobileContainer({ children }) {
  return (
    // Outer background (Desktop par black dikhega)
    <div className="min-h-screen bg-black flex justify-center w-full selection:bg-primary/30">
      
      {/* Actual Mobile App Frame */}
      <div className="w-full max-w-md bg-surface h-[100dvh] relative overflow-y-auto overflow-x-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-x border-border/50 flex flex-col">
        {children}
      </div>
      
    </div>
  )
}
