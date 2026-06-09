'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, Info } from 'lucide-react'
import { useState, useEffect } from 'react'

interface XPBarProps {
  xp: number
  level: number
  theme?: 'fantasy' | 'cyberpunk' | 'steampunk'
  streak?: number
  onStreakClick?: () => void
}

export default function XPBar({ xp, level, theme = 'fantasy', streak = 0, onStreakClick }: XPBarProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [prevXp, setPrevXp] = useState(xp)
  const [prevLevel, setPrevLevel] = useState(level)
  const [isFlashing, setIsFlashing] = useState(false)

  // Mapping dynamic styles based on theme
  const style = {
    fantasy: {
      barFill: 'bg-gradient-to-r from-[#7B4FCC] to-[#5a31b5] shadow-[0_0_15px_rgba(123,79,204,0.55)]',
      glowBg: 'bg-[#7B4FCC]/5',
      starColor: 'text-[#a78bfa]',
      shieldOuter: 'text-[#7B4FCC]/35',
      shieldInner: 'rgba(123,79,204,0.06)',
      levelText: 'from-white to-purple-200',
      rankText: 'text-purple-300',
      badgeFilter: 'drop-shadow-[0_0_10px_rgba(123,79,204,0.25)] hover:drop-shadow-[0_0_20px_rgba(123,79,204,0.45)]',
      borderFlash: ["rgba(63,63,70,0.8)", "rgba(123,79,204,0.8)", "rgba(63,63,70,0.8)"],
      boxShadowFlash: [
        "0 10px 30px -10px rgba(0,0,0,0.5)",
        "0 0 40px rgba(123,79,204,0.4)",
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
  const getRankName = (lvl: number, currentTheme: 'fantasy' | 'cyberpunk' | 'steampunk') => {
    if (currentTheme === 'cyberpunk') {
      if (lvl <= 2) return 'Ghost Node'
      if (lvl === 3) return 'Glitch Runner'
      if (lvl <= 5) return 'Circuit Breaker'
      if (lvl <= 7) return 'Neon Phantom'
      return 'Grid Sovereign'
    }
    
    if (currentTheme === 'steampunk') {
      if (lvl <= 2) return 'Copper Tinkerer'
      if (lvl === 3) return 'Gear Warden'
      if (lvl <= 5) return 'Vault Engineer'
      if (lvl <= 7) return 'Iron Chancellor'
      return 'Steam Sovereign'
    }
    
    // Aether Fantasy (Default)
    const fantasyRanks: Record<number, string> = {
      1: 'Neophyte Scribe',
      2: 'Wandering Seeker',
      3: 'Oath-Bound Apprentice',
      4: 'Ironwill Adept',
      5: 'Runebound Artisan',
      6: 'Veilwalker',
      7: 'Stormforged Knight',
      8: 'Arcane Sovereign',
      9: 'Legendary Architect'
    }
    return fantasyRanks[lvl] || fantasyRanks[9] || `Ascended Creator Lvl ${lvl}`
  }

  const getRankFlavour = (lvl: number, currentTheme: 'fantasy' | 'cyberpunk' | 'steampunk') => {
    if (currentTheme === 'cyberpunk') {
      if (lvl <= 2) return 'Undetected in the dark web.'
      if (lvl === 3) return 'Bypassing firewall protocols.'
      if (lvl <= 5) return 'Overloading the mainframe grids.'
      if (lvl <= 7) return 'Flickering between physical and digital states.'
      return 'The entire network bows to your code.'
    }
    
    if (currentTheme === 'steampunk') {
      if (lvl <= 2) return 'Striking the first brass gear.'
      if (lvl === 3) return 'Keeping the main mainspring wound.'
      if (lvl <= 5) return 'Taming the heavy high-pressure lines.'
      if (lvl <= 7) return 'Forging structural steam seals with steel.'
      return 'Superheating the engine of progress.'
    }
    
    // Aether Fantasy (Default)
    const fantasyFlavours: Record<number, string> = {
      1: 'Just picked up the quill',
      2: 'First steps into the unknown',
      3: 'Made the first real commitment',
      4: 'Survived the grind, still standing',
      5: 'Crafting real things now',
      6: 'Crossing into serious territory',
      7: 'Built through chaos and pressure',
      8: 'Commanding the craft',
      9: 'The world bends to your ambition'
    }
    return fantasyFlavours[lvl] || fantasyFlavours[9] || 'Transcending the bounds of mortal creation.'
  }

  const getTierShieldStyle = (lvl: number) => {
    if (lvl <= 3) {
      return {
        starColor: 'text-zinc-500',
        shieldOuter: 'text-zinc-500/40',
        shieldInner: 'rgba(113,113,122,0.08)',
        levelText: 'from-white to-zinc-350',
        badgeFilter: 'drop-shadow-[0_0_10px_rgba(113,113,122,0.25)] hover:drop-shadow-[0_0_20px_rgba(113,113,122,0.45)]',
        rankColorClass: 'text-zinc-400'
      }
    } else if (lvl <= 5) {
      return {
        starColor: 'text-teal-400',
        shieldOuter: 'text-teal-550/45',
        shieldInner: 'rgba(20,184,166,0.08)',
        levelText: 'from-white to-teal-200',
        badgeFilter: 'drop-shadow-[0_0_10px_rgba(20,184,166,0.25)] hover:drop-shadow-[0_0_20px_rgba(20,184,166,0.45)]',
        rankColorClass: 'text-teal-450'
      }
    } else if (lvl <= 7) {
      return {
        starColor: 'text-purple-400',
        shieldOuter: 'text-purple-500/40',
        shieldInner: 'rgba(168,85,247,0.08)',
        levelText: 'from-white to-purple-200',
        badgeFilter: 'drop-shadow-[0_0_10px_rgba(168,85,247,0.25)] hover:drop-shadow-[0_0_20px_rgba(168,85,247,0.45)]',
        rankColorClass: 'text-purple-300'
      }
    } else {
      return {
        starColor: 'text-amber-400',
        shieldOuter: 'text-amber-500/40',
        shieldInner: 'rgba(245,158,11,0.08)',
        levelText: 'from-white to-amber-200',
        badgeFilter: 'drop-shadow-[0_0_10px_rgba(245,158,11,0.3)] hover:drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]',
        rankColorClass: 'text-amber-500'
      }
    }
  }

  const tier = getTierShieldStyle(level)

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
          <div className={`relative h-16 w-16 flex items-center justify-center select-none shrink-0 transition-all duration-300 ${tier.badgeFilter}`}>
            {/* Rotating Star Background */}
            <Star className={`absolute h-10 w-10 animate-spin-slow opacity-20 ${tier.starColor}`} />
            
            {/* Shield Vector SVG */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" fill="currentColor">
              {/* Outer Shield Path */}
              <path 
                d="M50,6 L88,19.5 L88,52 C88,71.5 73,88 50,93 C27,88 12,71.5 12,52 L12,19.5 Z" 
                stroke="currentColor" 
                strokeWidth="4.5" 
                className={tier.shieldOuter}
              />
              {/* Inner Shield Overlay */}
              <path 
                d="M50,12 L81.5,23.5 L81.5,52 C81.5,68 69,82 50,86 C31,82 18.5,68 18.5,52 L18.5,23.5 Z" 
                fill={tier.shieldInner} 
              />
            </svg>
            
            <span className={`relative z-10 text-2xl font-black bg-gradient-to-b bg-clip-text text-transparent font-cinzel ${tier.levelText}`}>
              {level}
            </span>
          </div>
 
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Current Rank</span>
                <Trophy size={12} className="text-yellow-400" />
              </div>
              {streak > 0 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={onStreakClick}
                  className={`flex items-center gap-1.5 rounded-full bg-orange-500/10 border border-orange-500/25 px-2.5 py-0.5 text-[10px] font-bold text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.15)] select-none ${onStreakClick ? 'cursor-pointer hover:bg-orange-500/20 hover:border-orange-500/40 active:scale-95 transition-all' : ''}`}
                >
                  <span className="animate-pulse">🔥</span>
                  <span>{streak}-DAY STREAK</span>
                </motion.div>
              )}
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              {getRankName(level, theme)} <span className={tier.rankColorClass}>Level {level}</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1 italic font-medium tracking-wide">
              &quot;{getRankFlavour(level, theme)}&quot;
            </p>
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
            
            <div className="text-right">
              <span className="font-mono text-zinc-200">
                <span className={`font-bold ${style.rankText}`}>{xp}</span> / 1000 XP
              </span>
              <span className="block text-[10px] font-mono text-zinc-500 mt-0.5">
                Total: <span className={`font-bold ${style.rankText}`}>{((level - 1) * 1000 + xp).toLocaleString()}</span> XP earned
              </span>
            </div>
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