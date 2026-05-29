'use client'

import { motion } from 'framer-motion'
import { Trophy, Star } from 'lucide-react'

interface XPBarProps {
  xp: number
  level: number
}

export default function XPBar({ xp, level }: XPBarProps) {
  const progressPercentage = Math.min(100, Math.max(0, (xp / 1000) * 100))

  // Dynamically name ranks based on level ranges
  const getRankName = (lvl: number) => {
    if (lvl < 5) return 'Neophyte'
    if (lvl < 8) return 'Architect'
    if (lvl < 12) return 'Aether Sculptor'
    return 'Grand Sage'
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950/50 p-6 shadow-2xl backdrop-blur-xl">
      {/* Background Accent Glow */}
      <div className="absolute left-1/4 top-1/2 -z-10 h-24 w-80 -translate-y-1/2 bg-purple-500/5 blur-3xl" />

      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        
        {/* Level Badge and Title */}
        <div className="flex items-center gap-4">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10 text-purple-300 shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)]">
            <Star className="absolute h-9 w-9 animate-spin-slow opacity-15" />
            <span className="text-2xl font-black">{level}</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Current Rank</span>
              <Trophy size={12} className="text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              {getRankName(level)} <span className="text-purple-400">Level {level}</span>
            </h2>
          </div>
        </div>

        {/* XP Details and Progress */}
        <div className="flex-1 max-w-xl">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-zinc-400">Realm Experience</span>
            <span className="font-mono text-zinc-200">
              <span className="text-purple-400 font-bold">{xp}</span> / 1000 XP
            </span>
          </div>

          <div className="relative h-6 w-full overflow-hidden rounded-full bg-zinc-900 border border-zinc-800/50">
            {/* Pulsing sub-bar background */}
            <div className="absolute inset-0 bg-purple-500/5" />

            {/* Glowing active progress bar */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ type: 'spring', stiffness: 60, damping: 15 }}
              className="relative h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
            >
              {/* Inner highlight line */}
              <div className="absolute inset-x-0 top-0.5 h-[1.5px] bg-white/20" />
              
              {/* Glowing tip light */}
              <div className="absolute right-0 top-0 h-full w-2 bg-white/40 blur-[1px]" />
            </motion.div>
          </div>
        </div>
        
      </div>
    </div>
  )
}