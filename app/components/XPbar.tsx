'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, Info } from 'lucide-react'
import { useState, useEffect } from 'react'

interface XPBarProps {
  xp: number
  level: number
  theme?: 'fantasy' | 'cyberpunk' | 'steampunk'
}

export default function XPBar({ xp, level, theme = 'fantasy' }: XPBarProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [prevXp, setPrevXp] = useState(xp)
  const [prevLevel, setPrevLevel] = useState(level)
  const [isFlashing, setIsFlashing] = useState(false)

  // Mapping dynamic styles based on theme
  const style = {
    fantasy: {
      barFill: 'bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]',
      glowBg: 'bg-purple-500/5',
      starColor: 'text-purple-400',
      shieldOuter: 'text-purple-500/35',
      shieldInner: 'rgba(168,85,247,0.06)',
      levelText: 'from-white to-purple-200',
      rankText: 'text-purple-300',
      badgeFilter: 'drop-shadow-[0_0_10px_rgba(168,85,247,0.25)] hover:drop-shadow-[0_0_20px_rgba(168,85,247,0.45)]',
      borderFlash: ["rgba(63,63,70,0.8)", "rgba(168,85,247,0.8)", "rgba(63,63,70,0.8)"],
      boxShadowFlash: [
        "0 10px 30px -10px rgba(0,0,0,0.5)",
        "0 0 40px rgba(168,85,247,0.35)",
        "0 10px 30px -10px rgba(0,0,0,0.5)"
      ]
    },
    cyberpunk: {
      barFill: 'bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-600 shadow-[0_0_15px_rgba(6,182,212,0.5)]',
      glowBg: 'bg-cyan-500/5',
      starColor: 'text-cyan-400',
      shieldOuter: 'text-cyan-500/35',
      shieldInner: 'rgba(6,182,212,0.06)',
      levelText: 'from-white to-cyan-200',
      rankText: 'text-cyan-300',
      badgeFilter: 'drop-shadow-[0_0_10px_rgba(6,182,212,0.25)] hover:drop-shadow-[0_0_20px_rgba(6,182,212,0.45)]',
      borderFlash: ["rgba(63,63,70,0.8)", "rgba(6,182,212,0.8)", "rgba(63,63,70,0.8)"],
      boxShadowFlash: [
        "0 10px 30px -10px rgba(0,0,0,0.5)",
        "0 0 40px rgba(6,182,212,0.35)",
        "0 10px 30px -10px rgba(0,0,0,0.5)"
      ]
    },
    steampunk: {
      barFill: 'bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-600 shadow-[0_0_15px_rgba(249,115,22,0.5)]',
      glowBg: 'bg-orange-500/5',
      starColor: 'text-orange-400',
      shieldOuter: 'text-orange-500/35',
      shieldInner: 'rgba(249,115,22,0.06)',
      levelText: 'from-white to-orange-200',
      rankText: 'text-orange-400',
      badgeFilter: 'drop-shadow-[0_0_10px_rgba(249,115,22,0.25)] hover:drop-shadow-[0_0_20px_rgba(249,115,22,0.45)]',
      borderFlash: ["rgba(63,63,70,0.8)", "rgba(249,115,22,0.8)", "rgba(63,63,70,0.8)"],
      boxShadowFlash: [
        "0 10px 30px -10px rgba(0,0,0,0.5)",
        "0 0 40px rgba(249,115,22,0.35)",
        "0 10px 30px -10px rgba(0,0,0,0.5)"
      ]
    }
  }[theme]

  useEffect(() => {
    const gainedXp = xp > prevXp || level > prevLevel
    if (gainedXp) {
      setIsFlashing(true)
      const timer = setTimeout(() => setIsFlashing(false), 1200)
      return () => clearTimeout(timer)
    }
    setPrevXp(xp)
    setPrevLevel(level)
  }, [xp, level, prevXp, prevLevel])

  const progressPercentage = Math.min(100, Math.max(0, (xp / 1000) * 100))

  // Premium granular ranking system — distinct, rewarding rank name for every single level
  const getRankName = (lvl: number) => {
    const ranks: Record<number, string> = {
      1: 'Neophyte Scribe',
      2: 'Apprentice Spellweaver',
      3: 'Focus Adept',
      4: 'Habit Vanguard',
      5: 'Realm Architect',
      6: 'Aether Sculptor',
      7: 'Chrono Weaver',
      8: 'Iron Sentinel',
      9: 'Mindset Alchemist',
      10: 'Mythos Scriptor',
      11: 'Void Breaker',
      12: 'Star Forge Warden',
      13: 'Celestial Sentry',
      14: 'Grand Spellbreaker',
      15: 'Astral Overseer',
      16: 'Eternal Dynamo',
      17: 'Paradigm Shifter',
      18: 'Sovereign Scriptor',
      19: 'Cosmic Prime',
      20: 'Grand Sage Paragon'
    }
    return ranks[lvl] || `Ascended Creator Lvl ${lvl}`
  }
  return (
    <motion.div 
      animate={isFlashing ? {
        borderColor: style.borderFlash,
        boxShadow: style.boxShadowFlash
      } : {}}
      transition={{ duration: 1.0, ease: "easeInOut" }}
      className="relative rounded-3xl border border-zinc-800/80 bg-zinc-950/50 p-6 shadow-2xl backdrop-blur-xl transition-all duration-500"
    >
      {/* Background Accent Glow */}
      <div className={`absolute left-1/4 top-1/2 -z-10 h-24 w-80 -translate-y-1/2 blur-3xl ${style.glowBg}`} />
 
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        
        {/* Level Badge and Title */}
        <div className="flex items-center gap-4">
          <div className={`relative h-16 w-16 flex items-center justify-center select-none shrink-0 transition-all duration-300 ${style.badgeFilter}`}>
            {/* Rotating Star Background */}
            <Star className={`absolute h-10 w-10 animate-spin-slow opacity-20 ${style.starColor}`} />
            
            {/* Shield Vector SVG */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" fill="currentColor">
              {/* Outer Shield Path */}
              <path 
                d="M50,6 L88,19.5 L88,52 C88,71.5 73,88 50,93 C27,88 12,71.5 12,52 L12,19.5 Z" 
                stroke="currentColor" 
                strokeWidth="4.5" 
                className={style.shieldOuter}
              />
              {/* Inner Shield Overlay */}
              <path 
                d="M50,12 L81.5,23.5 L81.5,52 C81.5,68 69,82 50,86 C31,82 18.5,68 18.5,52 L18.5,23.5 Z" 
                fill={style.shieldInner} 
              />
            </svg>
            
            <span className={`relative z-10 text-2xl font-black bg-gradient-to-b bg-clip-text text-transparent font-cinzel ${style.levelText}`}>
              {level}
            </span>
          </div>
 
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Current Rank</span>
              <Trophy size={12} className="text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              {getRankName(level)} <span className={style.rankText}>Level {level}</span>
            </h2>
          </div>
        </div>
 
        {/* XP Details and Progress */}
        <div className="flex-1 max-w-xl">
          <div className="mb-2 flex items-center justify-between text-sm">
            <div className="relative flex items-center gap-1.5 group select-none">
              <span className="font-semibold text-zinc-400">Realm Experience</span>
              <div 
                className={`cursor-help transition-colors duration-200 p-0.5 rounded-full text-zinc-500 hover:${style.rankText}`}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <Info size={13} />
              </div>
              
              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute bottom-full left-0 mb-2.5 w-72 rounded-2xl border border-white/10 bg-zinc-950/95 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md z-30"
                  >
                    <div className="absolute top-full left-4 -mt-1 h-3.5 w-3.5 rotate-45 border-r border-b border-white/10 bg-zinc-950/95" />
                    <p className="text-[11px] leading-relaxed text-zinc-305">
                      <strong className="font-bold text-white">Earn XP</strong> by completing real-world quests. 
                      Reaching <strong className="font-bold text-white">1000 XP</strong> triggers a <strong className="font-bold text-white">Celestial Ascension (Level Up)</strong>, restoring realm stability, unlocking advanced custom roadmaps, and scribing new chapters in your evolving Codex!
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <span className="font-mono text-zinc-200">
              <span className={`font-bold ${style.rankText}`}>{xp}</span> / 1000 XP
            </span>
          </div>

          <div className="relative h-6 w-full overflow-hidden rounded-full bg-zinc-900 border border-zinc-800/50">
            {/* Pulsing sub-bar background */}
            <div className={`absolute inset-0 opacity-50 ${style.glowBg}`} />

            {/* Glowing active progress bar */}
            <div
              style={{ width: `${progressPercentage}%` }}
              className={`relative h-full rounded-full xp-bar-fill ${style.barFill} ${isFlashing ? 'xp-gained' : ''}`}
            >
              {/* Inner highlight line */}
              <div className="absolute inset-x-0 top-0.5 h-[1.5px] bg-white/20" />
              
              {/* Glowing tip light */}
              <div className="absolute right-0 top-0 h-full w-2 bg-white/40 blur-[1px]" />

              {/* Magical flash shimmer sweep laser overlay */}
              <AnimatePresence>
                {isFlashing && (
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.0, ease: 'easeInOut' }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent mix-blend-overlay pointer-events-none"
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        
      </div>
    </motion.div>
  )
}