'use client'

// QuestCard.tsx — Spacious, premium Quest Cards with dynamic difficulty-based color theme matrices.
// Themes:
//   - Common: Silver/Gray (zinc)
//   - Rare: Cyan
//   - Epic: Purple
//   - Legendary: Gold (yellow)

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sword, BookOpen, Sparkles, Check, ChevronDown, ChevronUp, X, Loader2, Lock, Clock, Trophy, Award, Play } from 'lucide-react'
import { Quest } from '../lib/data'

function QuestTimer({ deadline, isCompleted }: { deadline?: string; isCompleted: boolean }) {
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isCritical, setIsCritical] = useState<boolean>(false)

  useEffect(() => {
    if (!deadline || isCompleted) return

    const updateTimer = () => {
      const diff = new Date(deadline).getTime() - new Date().getTime()
      if (diff <= 0) {
        setTimeLeft('Expired')
        setIsCritical(true)
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      
      if (hours < 12) {
        setIsCritical(true)
      } else {
        setIsCritical(false)
      }

      if (hours >= 24) {
        const days = Math.floor(hours / 24)
        const remHours = hours % 24
        setTimeLeft(`${days}d ${remHours}h left`)
      } else {
        setTimeLeft(`${hours}h ${minutes}m left`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 60000)
    return () => clearInterval(interval)
  }, [deadline, isCompleted])

  if (!deadline || isCompleted) return null

  return (
    <div className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider font-mono select-none px-2.5 py-0.5 rounded-full border transition-all duration-300 ${
      isCritical 
        ? 'text-red-400 border-red-500/20 bg-red-500/10 animate-pulse' 
        : 'text-zinc-400 border-zinc-800 bg-zinc-900/40'
    }`}>
      <Clock size={10} />
      <span>{timeLeft}</span>
    </div>
  )
}

const playNodeChime = (theme: 'fantasy' | 'cyberpunk' | 'steampunk' = 'fantasy', type: 'complete' | 'uncomplete' | 'ascend') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const now = ctx.currentTime

    if (type === 'uncomplete') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(180, now)
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.15)
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.15)
      return
    }

    if (type === 'ascend') {
      const notes = [523.25, 659.25, 783.99, 1046.50]
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = theme === 'cyberpunk' ? 'sawtooth' : theme === 'steampunk' ? 'triangle' : 'sine'
        osc.frequency.setValueAtTime(freq, now + idx * 0.08)
        gain.gain.setValueAtTime(0, now + idx * 0.08)
        gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.08 + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.4)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.08)
        osc.stop(now + idx * 0.08 + 0.4)
      })
      return
    }

    if (theme === 'cyberpunk') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(900, now)
      osc.frequency.exponentialRampToValueAtTime(1600, now + 0.12)
      
      const filter = ctx.createBiquadFilter()
      filter.type = 'highpass'
      filter.frequency.setValueAtTime(800, now)

      gain.gain.setValueAtTime(0.05, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
      
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      
      osc.start(now)
      osc.stop(now + 0.12)
    } else if (theme === 'steampunk') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(120, now)
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08)

      gain.gain.setValueAtTime(0.1, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.08)

      const clickOsc = ctx.createOscillator()
      const clickGain = ctx.createGain()
      clickOsc.type = 'sine'
      clickOsc.frequency.setValueAtTime(2000, now)
      clickGain.gain.setValueAtTime(0.05, now)
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02)
      clickOsc.connect(clickGain)
      clickGain.connect(ctx.destination)
      clickOsc.start(now)
      clickOsc.stop(now + 0.02)
    } else {
      const notes = [880.00, 1109.73]
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + idx * 0.05)
        gain.gain.setValueAtTime(0, now + idx * 0.05)
        gain.gain.linearRampToValueAtTime(0.06, now + idx * 0.05 + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.25)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.05)
        osc.stop(now + idx * 0.05 + 0.25)
      })
    }
  } catch (err) {
    console.warn('Audio chime synthesis failed:', err)
  }
}

const ParticleExplosion = ({ color }: { color: string }) => {
  const particles = Array.from({ length: 10 })
  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
      {particles.map((_, idx) => {
        const angle = (idx / 10) * 360
        const distance = 20 + Math.random() * 25
        const x = Math.cos((angle * Math.PI) / 180) * distance
        const y = Math.sin((angle * Math.PI) / 180) * distance
        const size = 3 + Math.random() * 4

        return (
          <motion.div
            key={idx}
            initial={{ x: 0, y: 0, scale: 0.6, opacity: 1 }}
            animate={{ 
              x: x, 
              y: y, 
              scale: [0.6, 1.2, 0], 
              opacity: [1, 1, 0] 
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`absolute rounded-full ${color}`}
            style={{
              width: `${size}px`,
              height: `${size}px`,
            }}
          />
        )
      })}
    </div>
  )
}

interface QuestCardProps {
  quest: Quest
  onComplete: (id: number) => void
  onFail?: (id: number) => void
  isNarrating?: boolean
  narratedMythEvent?: string
  onGenerateRoadmap?: (id: number) => void
  isGeneratingRoadmap?: boolean
  onToggleTask?: (questId: number, taskIndex: number) => void
  isLocked?: boolean
  parentQuestTitle?: string
  worldTheme?: 'fantasy' | 'cyberpunk' | 'steampunk'
}

export default function QuestCard({
  quest,
  onComplete,
  onFail,
  isNarrating = false,
  narratedMythEvent,
  onGenerateRoadmap,
  isGeneratingRoadmap = false,
  onToggleTask,
  isLocked = false,
  parentQuestTitle,
  worldTheme = 'fantasy',
}: QuestCardProps) {
  const [expanded, setExpanded] = useState(!!(quest.tasks && quest.tasks.length > 0))
  const [viewMode, setViewMode] = useState<'list' | 'flowchart'>('list')
  const [completedState, setCompletedState] = useState<boolean[]>(quest.completedTasks || [])
  const [activeBursts, setActiveBursts] = useState<Record<number, boolean>>({})

  useEffect(() => {
    const currentCompleted = quest.completedTasks || []
    let changed = false
    currentCompleted.forEach((val, idx) => {
      const prevVal = completedState[idx] ?? false
      if (val && !prevVal) {
        setActiveBursts((prev) => ({ ...prev, [idx]: true }))
        playNodeChime(worldTheme, 'complete')
        setTimeout(() => {
          setActiveBursts((prev) => {
            const next = { ...prev }
            delete next[idx]
            return next
          })
        }, 1000)
        changed = true
      } else if (!val && prevVal) {
        playNodeChime(worldTheme, 'uncomplete')
        changed = true
      }
    })
    if (changed || currentCompleted.length !== completedState.length) {
      setCompletedState(currentCompleted)
    }
  }, [quest.completedTasks, worldTheme, completedState])

  // ── Difficulty Colour Configurations (Silver, Cyan, Purple, Gold) ─────────
  const difficultyColors = {
    Common: {
      border: 'border-zinc-800/80 hover:border-zinc-700',
      label: 'text-zinc-400 font-bold uppercase tracking-widest text-[10px]',
      bgGlow: 'from-transparent to-zinc-900/10',
      glow: 'shadow-[0_0_20px_-3px_rgba(161,161,170,0.15)]',
      glowColor: 'bg-zinc-500',
      iconBg: 'bg-zinc-850/60 text-zinc-300 border-zinc-800',
      progressBar: 'from-zinc-600 to-zinc-400 shadow-[0_0_12px_rgba(161,161,170,0.25)]',
      checkboxBorder: 'border-zinc-750 group-hover:border-zinc-550',
      checkboxChecked: 'border-zinc-450 bg-zinc-500 text-black shadow-[0_0_8px_rgba(161,161,170,0.3)]',
      taskHighlight: 'hover:bg-zinc-500/5 hover:border-zinc-500/20',
      taskCheckedHighlight: 'bg-zinc-500/5 border-zinc-550/10 shadow-[0_0_12px_rgba(161,161,170,0.05)]',
      xpText: 'text-zinc-350 bg-zinc-500/10 border-zinc-500/20',
      completeBtn: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-200 hover:border-zinc-400 hover:bg-zinc-500/20 shadow-[0_0_15px_rgba(161,161,170,0.2)]',
      chapterHighlight: 'border-zinc-500/15',
      completedLabel: 'text-zinc-350 bg-zinc-500/10 border-zinc-500/20',
      completedGlow: 'bg-zinc-400',
      completedBorder: 'border-zinc-500/20',
      completedShadow: 'shadow-[0_0_25px_rgba(161,161,170,0.08)]',
    },
    Rare: {
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      label: 'text-cyan-400 font-bold uppercase tracking-widest text-[10px]',
      bgGlow: 'from-transparent via-cyan-950/5 to-cyan-900/10',
      glow: 'shadow-[0_0_20px_-3px_rgba(34,211,238,0.25)]',
      glowColor: 'bg-cyan-400',
      iconBg: 'bg-cyan-950/30 text-cyan-400 border-cyan-900/35',
      progressBar: 'from-cyan-600 to-teal-400 shadow-[0_0_12px_rgba(34,211,238,0.4)]',
      checkboxBorder: 'border-zinc-750 group-hover:border-cyan-500/50',
      checkboxChecked: 'border-cyan-500 bg-cyan-500 text-white shadow-[0_0_8px_rgba(34,211,238,0.4)]',
      taskHighlight: 'hover:bg-cyan-500/5 hover:border-cyan-500/20',
      taskCheckedHighlight: 'bg-cyan-500/5 border-cyan-500/10 shadow-[0_0_12px_rgba(34,211,238,0.06)]',
      xpText: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20',
      completeBtn: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200 hover:border-cyan-400 hover:bg-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.25)]',
      chapterHighlight: 'border-cyan-500/15',
      completedLabel: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20',
      completedGlow: 'bg-cyan-400',
      completedBorder: 'border-cyan-500/20',
      completedShadow: 'shadow-[0_0_25px_rgba(34,211,238,0.1)]',
    },
    Epic: {
      border: 'border-purple-500/20 hover:border-purple-500/40',
      label: 'text-purple-300 font-bold uppercase tracking-widest text-[10px]',
      bgGlow: 'from-transparent via-purple-950/5 to-purple-900/10',
      glow: 'shadow-[0_0_20px_-3px_rgba(168,85,247,0.25)]',
      glowColor: 'bg-purple-400',
      iconBg: 'bg-purple-950/30 text-purple-300 border-purple-900/35',
      progressBar: 'from-purple-600 to-fuchsia-400 shadow-[0_0_12px_rgba(168,85,247,0.45)]',
      checkboxBorder: 'border-zinc-750 group-hover:border-purple-500/50',
      checkboxChecked: 'border-purple-500 bg-purple-500 text-white shadow-[0_0_8px_rgba(168,85,247,0.4)]',
      taskHighlight: 'hover:bg-purple-500/5 hover:border-purple-500/20',
      taskCheckedHighlight: 'bg-purple-500/5 border-purple-500/10 shadow-[0_0_12px_rgba(168,85,247,0.06)]',
      xpText: 'text-purple-300 bg-purple-500/10 border-purple-500/20',
      completeBtn: 'border-purple-500/40 bg-purple-500/10 text-purple-200 hover:border-purple-300 hover:bg-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.25)]',
      chapterHighlight: 'border-purple-500/15',
      completedLabel: 'text-purple-200 bg-purple-500/10 border-purple-500/20',
      completedGlow: 'bg-purple-500',
      completedBorder: 'border-purple-500/20',
      completedShadow: 'shadow-[0_0_25px_rgba(168,85,247,0.1)]',
    },
    Legendary: {
      border: 'border-yellow-500/20 hover:border-yellow-500/50',
      label: 'text-yellow-400 font-extrabold tracking-wide uppercase text-[10px]',
      bgGlow: 'from-transparent via-yellow-950/5 to-yellow-900/10',
      glow: 'shadow-[0_0_20px_-3px_rgba(234,179,8,0.3)]',
      glowColor: 'bg-yellow-400',
      iconBg: 'bg-yellow-950/30 text-yellow-400 border-yellow-900/35',
      progressBar: 'from-yellow-500 via-amber-400 to-orange-400 shadow-[0_0_15px_rgba(234,179,8,0.5)]',
      checkboxBorder: 'border-zinc-750 group-hover:border-yellow-500/50',
      checkboxChecked: 'border-yellow-500 bg-yellow-500 text-black shadow-[0_0_8px_rgba(234,179,8,0.5)]',
      taskHighlight: 'hover:bg-yellow-500/5 hover:border-yellow-500/20',
      taskCheckedHighlight: 'bg-yellow-500/5 border-yellow-500/10 shadow-[0_0_12px_rgba(234,179,8,0.08)]',
      xpText: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20',
      completeBtn: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-200 hover:border-yellow-450 hover:bg-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.35)]',
      chapterHighlight: 'border-yellow-500/15',
      completedLabel: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20',
      completedGlow: 'bg-yellow-500',
      completedBorder: 'border-yellow-500/20',
      completedShadow: 'shadow-[0_0_25px_rgba(234,179,8,0.15)]',
    }
  }

  const categoryIcons = {
    wisdom: BookOpen,
    discipline: Sword,
    creation: Sparkles,
  }

  const CategoryIcon = categoryIcons[quest.category] || categoryIcons.discipline
  const theme = difficultyColors[quest.difficulty] || difficultyColors.Common

  // ── Completed card state ──────────────────────────────────────────────────
  if (quest.isCompleted) {
    const hasMythEvent = quest.mythEvent || narratedMythEvent
    return (
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          borderColor: quest.failed ? 'rgba(239, 68, 68, 0.25)' : theme.completedBorder,
          boxShadow: quest.failed ? '0 0 25px rgba(239, 68, 68, 0.08)' : theme.completedShadow
        }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        className={`w-full h-full relative overflow-hidden rounded-2xl sm:rounded-[2rem] border bg-zinc-950/60 p-5 sm:p-8 md:p-9 backdrop-blur-md transition-all duration-500 ${
          quest.failed ? 'border-red-500/20' : theme.border
        }`}
      >
        {/* Glowing aura */}
        <div className={`absolute -right-16 -top-16 h-32 w-32 rounded-full opacity-10 blur-3xl pointer-events-none ${
          quest.failed ? 'bg-red-500' : theme.completedGlow
        }`} />

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2 border transition-all duration-300 ${
              quest.failed 
                ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                : `${theme.iconBg} animate-pulse`
            }`}>
              {quest.failed ? <X size={16} /> : <Check size={16} />}
            </div>
            <h3 className={`text-2xl font-extrabold font-cinzel ${quest.failed ? 'line-through text-zinc-650' : 'line-through text-zinc-500'}`}>
              {quest.title}
            </h3>
          </div>
          <span className={`text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full border transition-all duration-300 ${
            quest.failed ? 'text-red-400 bg-red-500/10 border-red-500/20' : theme.completedLabel
          }`}>
            {quest.failed ? 'Abandoned' : 'Chronicled'}
          </span>
        </div>

        <p className="mt-4 text-base text-zinc-500 leading-relaxed">{quest.description}</p>
        
        {/* Narrated myth event panel */}
        {hasMythEvent && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 80 }}
            className={`mt-6 rounded-2xl border p-5 bg-black/45 ${
              quest.failed ? 'border-red-500/10' : theme.chapterHighlight
            }`}
          >
            <span className={`text-[10px] font-bold uppercase tracking-widest block mb-2 font-mono ${
              quest.failed ? 'text-red-400' : theme.completedLabel.split(' ')[0]
            }`}>
              {quest.failed ? 'Shadow Chronicle' : 'Legendary Codex Unlocked'}
            </span>
            <p className="text-sm italic text-zinc-400 leading-relaxed font-serif tracking-wide text-justify">
              “{narratedMythEvent || quest.mythEvent}”
            </p>
          </motion.div>
        )}

        <div className="mt-6 border-t border-zinc-800/40 pt-4">
          <span className="text-sm font-semibold text-zinc-500 font-mono">
            {quest.failed ? '0 XP Gained' : `+${quest.xp} XP Claimed`}
          </span>
        </div>
      </motion.div>
    )
  }

  // ── Active quest card state ───────────────────────────────────────────────
  const hasTasks = quest.tasks && quest.tasks.length > 0
  const hasMythEvent = quest.mythEvent || narratedMythEvent
  const totalCount = quest.tasks ? quest.tasks.length : 0
  const completedCount = quest.completedTasks ? quest.completedTasks.slice(0, totalCount).filter(Boolean).length : 0
  const allTasksCompleted = hasTasks && (completedCount === totalCount)
  const isCompleteDisabled = isNarrating || !hasTasks || !allTasksCompleted

  return (
    <motion.div
      whileHover={isLocked ? {} : { y: -4, scale: 1.015 }}
      className={`w-full h-full relative overflow-hidden rounded-2xl sm:rounded-[2rem] border p-5 sm:p-8 md:p-9 transition-all duration-305 ${
        isLocked
          ? 'border-zinc-900 bg-zinc-950/40 opacity-55 grayscale-[20%] select-none shadow-none'
          : `${theme.border} bg-gradient-to-br from-zinc-900/60 ${theme.bgGlow} to-zinc-950/80 ${theme.glow} backdrop-blur-md`
      }`}
    >
      {/* Locked Quest Overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/65 backdrop-blur-[1px] p-6 text-center pointer-events-auto select-none">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-850 bg-zinc-900/90 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.15)] mb-3 animate-pulse">
            <Lock size={18} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300 font-mono">Quest Locked</span>
          <h4 className="text-xs font-semibold text-zinc-300 mt-1.5 max-w-xs px-6 leading-relaxed">
            Complete "{parentQuestTitle || 'previous quest'}" to unlock
          </h4>
        </div>
      )}

      {/* Decorative corner glow */}
      {!isLocked && (
        <div className={`absolute -right-16 -top-16 h-32 w-32 rounded-full opacity-10 blur-2xl pointer-events-none ${theme.glowColor}`} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={`rounded-2xl p-2.5 sm:p-3 border shrink-0 ${theme.iconBg}`}>
            <CategoryIcon size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={theme.label}>
                {quest.difficulty} Quest
              </span>
              <QuestTimer deadline={quest.deadline} isCompleted={quest.isCompleted} />
            </div>
            <h3 className="text-lg sm:text-2xl font-extrabold text-white mt-0.5 sm:mt-1 tracking-tight font-cinzel">{quest.title}</h3>
          </div>
        </div>

        {/* Expand/collapse toggle */}
        {(hasTasks || hasMythEvent) && (
          <button
            onClick={() => setExpanded((p) => !p)}
            className="mt-1 shrink-0 rounded-xl border border-zinc-800 bg-zinc-900/50 p-2 text-zinc-500 transition hover:border-zinc-700 hover:text-zinc-300"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {/* Description */}
      <p className="mt-5 text-base text-zinc-300/90 leading-relaxed">{quest.description}</p>

      {/* Top-Level Mini Progress Bar (Always Visible) */}
      {hasTasks && (
        <div className="mt-5 px-0.5 space-y-2 select-none">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">
            <span>Realm Coordinates Synced</span>
            <span className={`${theme.label.split(' ')[0]} font-mono text-xs`}>
              {completedCount} / {totalCount} Completed ({Math.round((completedCount / totalCount) * 100)}%)
            </span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-950/80 border border-zinc-850/50 shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / totalCount) * 100}%` }}
              transition={{ type: 'spring', stiffness: 70, damping: 14 }}
              className={`h-full rounded-full bg-gradient-to-r ${theme.progressBar}`}
            />
          </div>
        </div>
      )}

      {/* Expandable Body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {/* Task Checklist Spacer */}
            {hasTasks && <div className="mt-5 border-t border-zinc-800/40 pt-4" />}

            {/* View Mode Toggle */}
            {hasTasks && (
              <div className="mt-4 flex items-center justify-between px-0.5 select-none">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 font-mono">
                  Sacred Quest progression
                </span>
                <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-850">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all duration-200 hover:cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-zinc-900 text-zinc-100 shadow-sm border border-zinc-800'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Checklist
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('flowchart')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all duration-200 hover:cursor-pointer ${
                      viewMode === 'flowchart'
                        ? 'bg-zinc-900 text-zinc-100 shadow-sm border border-zinc-800'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Flowchart
                  </button>
                </div>
              </div>
            )}

            {/* Task Checklist (List View) */}
            {hasTasks && viewMode === 'list' && (
              <div className="mt-6 space-y-3.5 px-0.5">
                {quest.tasks!.map((task, i) => {
                  const isChecked = quest.completedTasks?.[i] || false
                  const parts = task.split('|')
                  const mainTask = parts[0]?.trim() || task
                  const loreSubtitle = parts[1]?.trim() || ''

                  return (
                    <button
                      key={i}
                      onClick={() => onToggleTask && onToggleTask(quest.id, i)}
                      className={`flex items-start gap-3 sm:gap-4 w-full text-left p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-zinc-850/50 transition-all duration-300 hover:cursor-pointer ${
                        isChecked 
                          ? theme.taskCheckedHighlight 
                          : `bg-zinc-900/15 group ${theme.taskHighlight}`
                      }`}
                    >
                      <div className={`mt-0.5 flex h-4.5 w-4.5 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                        isChecked 
                          ? theme.checkboxChecked 
                          : `bg-zinc-950 shadow-inner ${theme.checkboxBorder}`
                      }`}>
                        {isChecked && <Check size={11} strokeWidth={4} />}
                      </div>
 
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-sm sm:text-base font-semibold transition-all duration-300 pr-3 sm:pr-4 ${
                            isChecked ? 'text-zinc-550 line-through' : 'text-zinc-200 group-hover:text-white'
                          }`}>
                            {mainTask}
                          </span>
                          <span className={`text-[10px] sm:text-xs font-bold font-mono px-2 sm:px-2.5 py-0.5 rounded-full select-none shrink-0 ml-3 sm:ml-4 border ${theme.xpText}`}>
                            +25 XP
                          </span>
                        </div>
                        {loreSubtitle && (
                          <span className={`text-xs sm:text-sm italic mt-1 sm:mt-1.5 font-serif tracking-wide transition-all duration-305 ${
                            isChecked ? 'text-zinc-650' : 'text-zinc-500 font-medium'
                          }`}>
                            “{loreSubtitle}”
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Task Checklist (Flowchart View) */}
            {hasTasks && viewMode === 'flowchart' && (
              <div className="mt-8 px-0.5 relative select-none">
                <div className="flex flex-col items-center">
                  
                  {/* Start Node */}
                  <div className="flex flex-col items-center w-full max-w-md">
                    <div className="flex items-center gap-3 rounded-2xl border bg-zinc-950/80 p-3.5 w-full shadow-md border-zinc-850">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-850 ${theme.xpText.split(' ')[0]}`}>
                        <Play size={15} className="fill-current" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono font-bold">Quest Inception</p>
                        <p className="text-sm font-bold text-zinc-200 truncate">{quest.title}</p>
                      </div>
                    </div>
                    {/* Connector */}
                    <div className="relative h-8 w-[2px] flex items-center justify-center">
                      <div className={`absolute inset-0 w-full h-full ${
                        quest.completedTasks?.[0] 
                          ? 'hidden' 
                          : 'bg-zinc-850'
                      }`} />
                      {quest.completedTasks?.[0] && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: '100%' }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                          className={`absolute top-0 w-full ${theme.glowColor} shadow-[0_0_8px_rgba(255,255,255,0.25)]`}
                        />
                      )}
                    </div>
                  </div>

                  {/* Task Nodes */}
                  {quest.tasks!.map((task, i) => {
                    const isCompleted = quest.completedTasks?.[i] ?? false
                    const isPrevCompleted = i === 0 || (quest.completedTasks?.[i - 1] ?? false)
                    const isActive = !isCompleted && isPrevCompleted
                    const isUpcoming = !isCompleted && !isPrevCompleted

                    const parts = task.split('|')
                    const mainTask = parts[0]?.trim() || task
                    const loreSubtitle = parts[1]?.trim() || ''

                    let nodeStyle = 'border-zinc-850 bg-zinc-950/20 text-zinc-600 opacity-60'
                    let circleStyle = 'border-zinc-850 bg-zinc-900/50 text-zinc-550'
                    
                    if (isCompleted) {
                      nodeStyle = `${theme.taskCheckedHighlight} border-l-4 ${theme.completedBorder} text-zinc-300`
                      circleStyle = `${theme.checkboxChecked} text-white`
                    } else if (isActive) {
                      nodeStyle = `bg-zinc-900/30 border border-zinc-700/80 text-zinc-200 shadow-[0_0_15px_rgba(255,255,255,0.03)] animate-pulse-soft`
                      circleStyle = `border-white/40 bg-zinc-950 text-white ring-2 ring-white/10`
                    }

                    const showNextConnector = i < quest.tasks!.length - 1

                    return (
                      <div key={i} className="flex flex-col items-center w-full max-w-md">
                        <button
                          type="button"
                          disabled={isUpcoming}
                          onClick={() => onToggleTask && onToggleTask(quest.id, i)}
                          className={`flex items-start gap-4 p-4 rounded-2xl border text-left w-full transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] group ${
                            isUpcoming ? 'cursor-not-allowed' : 'hover:cursor-pointer'
                          } ${nodeStyle}`}
                        >
                          <div className="relative shrink-0">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-xl border font-mono text-xs font-bold transition-all duration-300 ${circleStyle}`}>
                              {isCompleted ? <Check size={12} strokeWidth={3} /> : isUpcoming ? <Lock size={10} className="text-zinc-650" /> : i + 1}
                            </div>
                            {activeBursts[i] && <ParticleExplosion color={theme.glowColor} />}
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div className={`transition-all duration-300 ${isUpcoming ? 'blur-[1.5px] opacity-40 select-none' : ''}`}>
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-sm font-semibold transition-all duration-300 ${
                                  isCompleted ? 'line-through text-zinc-550' : 'text-zinc-200'
                                }`}>
                                  {mainTask}
                                </span>
                                {!isUpcoming && (
                                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${theme.xpText}`}>
                                    +25 XP
                                  </span>
                                )}
                              </div>
                              {loreSubtitle && (
                                <p className={`text-xs italic mt-1 font-serif tracking-wide ${
                                  isCompleted ? 'text-zinc-650' : 'text-zinc-400 font-medium'
                                }`}>
                                  “{loreSubtitle}”
                                </p>
                              )}
                            </div>
                            
                            <div className="mt-2 flex items-center gap-1.5 select-none">
                              {isCompleted && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/15">
                                  Completed
                                </span>
                              )}
                              {isActive && (
                                <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase bg-white/5 px-2 py-0.5 rounded-md border border-white/10 text-white animate-pulse`}>
                                  Active Step
                                </span>
                              )}
                              {isUpcoming && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase text-zinc-650 bg-zinc-900/40 px-2.5 py-0.5 rounded-md border border-zinc-850/60">
                                  <Lock size={8} /> Locked
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                        
                        {showNextConnector && (
                          <div className="relative h-8 w-[2px] flex items-center justify-center">
                            <div className={`absolute inset-0 w-full h-full ${
                              isCompleted 
                                ? 'hidden' 
                                : 'border-dashed border-l-2 border-zinc-850'
                            }`} />
                            {isCompleted && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: '100%' }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                                className={`absolute top-0 w-full ${theme.glowColor} shadow-[0_0_8px_rgba(255,255,255,0.25)]`}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Connector to end node */}
                  {(() => {
                    const allTasksCompleted = quest.completedTasks?.every((t) => t) ?? false
                    return (
                      <div className="relative h-8 w-[2px] flex items-center justify-center">
                        <div className={`absolute inset-0 w-full h-full ${
                          allTasksCompleted 
                            ? 'hidden' 
                            : 'border-dashed border-l-2 border-zinc-850'
                        }`} />
                        {allTasksCompleted && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: '100%' }}
                            transition={{ duration: 0.45, ease: 'easeOut' }}
                            className={`absolute top-0 w-full ${theme.glowColor} shadow-[0_0_8px_rgba(255,255,255,0.25)]`}
                          />
                        )}
                      </div>
                    )
                  })()}

                  {/* End Node */}
                  {(() => {
                    const allTasksCompleted = quest.completedTasks?.every((t) => t) ?? false
                    const endNodeStyle = allTasksCompleted
                      ? `${theme.completeBtn} border animate-pulse`
                      : 'border-zinc-850 bg-zinc-950/20 text-zinc-600 opacity-50 cursor-not-allowed'
                    return (
                      <div className="flex flex-col items-center w-full max-w-md">
                        <button
                          type="button"
                          disabled={!allTasksCompleted}
                          onClick={() => {
                            playNodeChime(worldTheme, 'ascend')
                            onComplete(quest.id)
                          }}
                          className={`flex items-center gap-3.5 rounded-2xl p-4 w-full text-left transition-all duration-300 ${
                            allTasksCompleted ? 'hover:scale-[1.02] active:scale-[0.98] hover:cursor-pointer' : ''
                          } ${endNodeStyle}`}
                        >
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                            allTasksCompleted 
                              ? 'bg-yellow-500/10 border-yellow-500/35 text-yellow-450 animate-bounce' 
                              : 'bg-zinc-900/50 border-zinc-850 text-zinc-550'
                          }`}>
                            {allTasksCompleted ? <Trophy size={18} /> : <Lock size={16} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono font-bold">Quest Finalization</p>
                            <p className={`text-sm font-black uppercase tracking-wider ${allTasksCompleted ? 'text-yellow-450' : 'text-zinc-500'}`}>
                              {allTasksCompleted ? 'Claim Glory & Finish' : 'Ascension Locked'}
                            </p>
                            <p className="text-xs text-zinc-500 mt-0.5 leading-tight">
                              {allTasksCompleted ? 'Scribe this quest into the archives and earn bonuses!' : 'Resolve all steps in sequence to unlock.'}
                            </p>
                          </div>
                        </button>
                      </div>
                    )
                  })()}

                </div>
              </div>
            )}

            {/* Myth Event Panel */}
            {hasMythEvent && (
              <div className="mt-6 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-2 font-mono">
                  Myth Event · On Completion
                </span>
                {isNarrating ? (
                  <div className="flex items-center gap-2 text-xs italic text-zinc-500">
                    <Loader2 size={12} className="animate-spin" />
                    <span>The Narrator awakens…</span>
                  </div>
                ) : (
                  <p className="text-sm italic text-zinc-400 leading-relaxed font-serif tracking-wide">
                    {narratedMythEvent || quest.mythEvent}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate AI Roadmap Button */}
      {!hasTasks && onGenerateRoadmap && (
        <div className="mt-6 border-t border-zinc-800/60 pt-5 flex flex-col items-center justify-center py-5 bg-zinc-950/20 rounded-2xl border border-dashed border-zinc-850">
          <BookOpen size={26} className="text-zinc-700/50 mb-2" />
          <span className="text-sm text-zinc-550 font-semibold mb-4 text-center px-4">
            This quest has no active roadmap or tasks.
          </span>
          <button
            onClick={() => {
              onGenerateRoadmap(quest.id)
              setExpanded(true)
            }}
            disabled={isGeneratingRoadmap}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 px-6 py-2.5 text-xs font-bold text-purple-300 transition hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingRoadmap ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                <span>Unlocking Roadmap…</span>
              </>
            ) : (
              <>
                <Sparkles size={12} className="animate-pulse" />
                <span>Forge AI Roadmap</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Footer Divider & Buttons */}
      <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-between gap-3 sm:gap-4 border-t border-zinc-850 pt-4 sm:pt-5">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <span className={`h-8 sm:h-9 flex items-center justify-center rounded-xl border px-2.5 sm:px-3.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-sm whitespace-nowrap shrink-0 ${theme.xpText}`}>
            +{quest.xp} XP
          </span>
          {hasTasks && (
            <span className="h-8 sm:h-9 flex items-center justify-center rounded-xl border border-zinc-800/80 bg-zinc-950/80 px-2 sm:px-3 text-[10px] sm:text-xs font-bold text-zinc-400 font-mono whitespace-nowrap shrink-0">
              {completedCount}/{totalCount} Tasks
            </span>
          )}
        </div>
 
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Fail Button */}
          {onFail && (
            <button
              onClick={() => onFail(quest.id)}
              disabled={isNarrating}
              className="h-8 sm:h-9 flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3 sm:px-4.5 text-[10px] sm:text-xs font-bold text-red-400 transition hover:border-red-500/40 hover:bg-red-500/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
            >
              <X size={11} />
              Failed
            </button>
          )}
 
          {/* Complete Button */}
          <button
            onClick={() => {
              playNodeChime(worldTheme, 'ascend')
              onComplete(quest.id)
            }}
            disabled={isCompleteDisabled}
            className={`relative h-8 sm:h-9 overflow-hidden flex items-center justify-center rounded-xl border px-3 sm:px-5 text-[10px] sm:text-xs font-bold transition-all duration-300 active:scale-[95] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0 ${
              allTasksCompleted
                ? `hover:cursor-pointer ${theme.completeBtn}`
                : 'border-zinc-800 bg-zinc-950 text-zinc-550'
            }`}
          >
            {!hasTasks ? 'Unlock Roadmap First' : allTasksCompleted ? 'Complete Quest' : 'Finish all tasks'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}