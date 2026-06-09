'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Compass, Sparkles, Zap, Sword, Cog, Cpu, CheckCircle2 } from 'lucide-react'
import { World, worldTemplates } from '../lib/data'

interface WorldArchitectProps {
  activeWorld: World
  onChangeWorld: (theme: 'fantasy' | 'cyberpunk' | 'steampunk') => void
  onForgeCustomWorld: (prompt: string) => void
  stability: number
  level: number
  isForging?: boolean
}

export default function WorldArchitect({
  activeWorld,
  onChangeWorld,
  onForgeCustomWorld,
  stability,
  level,
  isForging = false,
}: WorldArchitectProps) {
  const themes = [
    {
      id: 'fantasy',
      label: 'Aether Fantasy',
      desc: 'Glowing scrolls, mana spires, and bug serpents.',
      icon: Sword,
      color: 'border-[#7B4FCC]/30 text-[#a78bfa] bg-[#7B4FCC]/5',
      activeColor: 'border-[#7B4FCC]/80 bg-[#7B4FCC]/10 shadow-[0_0_20px_rgba(123,79,204,0.3)] text-[#c4b5fd]',
    },
    {
      id: 'cyberpunk',
      label: 'Neon Cyberpunk',
      desc: 'Grid hacks, memory overflows, and terminal nets.',
      icon: Cpu,
      color: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/5',
      activeColor: 'border-cyan-500/80 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.3)] text-cyan-300',
    },
    {
      id: 'steampunk',
      label: 'Steampunk Keep',
      desc: 'Pressure gauges, steam valves, and clockwork cores.',
      icon: Cog,
      color: 'border-orange-500/30 text-orange-400 bg-orange-500/5',
      activeColor: 'border-orange-500/80 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.3)] text-orange-400',
    },
  ]

  // Track whether the current active world is a custom forge
  const isCustomRealm =
    !Object.values(worldTemplates).some((t) => t.name === activeWorld.name)

  // Toast state: shown for 5s after a successful forge
  const [forgeToast, setForgeToast] = useState<{ name: string; lore?: string } | null>(null)
  // Flash animation key — increments each time a new realm is set
  const [flashKey, setFlashKey] = useState(0)
  // Track previous world name to detect changes
  const [prevWorldName, setPrevWorldName] = useState(activeWorld.name)

  useEffect(() => {
    // If the world name changed while isForging was true (or just became false), show toast
    if (activeWorld.name !== prevWorldName) {
      if (isCustomRealm) {
        setForgeToast({ name: activeWorld.name })
        setFlashKey((k) => k + 1)
        const timer = setTimeout(() => setForgeToast(null), 5000)
        return () => clearTimeout(timer)
      }
      setPrevWorldName(activeWorld.name)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorld.name])

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const input = form.elements.namedItem('worldPrompt') as HTMLInputElement
    if (input) {
      const value = input.value.trim() || 'A floating clockwork observatory in a nebula'
      onForgeCustomWorld(value)
      form.reset()
    }
  }  // Theme-aware accent for the success flash
  const themeFlash = {
    fantasy: 'shadow-[0_0_40px_rgba(123,79,204,0.25)] border-[#7B4FCC]/50',
    cyberpunk: 'shadow-[0_0_40px_rgba(6,182,212,0.25)] border-cyan-500/50',
    steampunk: 'shadow-[0_0_40px_rgba(249,115,22,0.25)] border-orange-500/50',
  }[activeWorld.theme]

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950/50 p-6 backdrop-blur-xl transition-all duration-500 ${
      activeWorld.theme === 'fantasy'
        ? 'hover:border-[#7B4FCC]/40 hover:shadow-[0_0_25px_rgba(123,79,204,0.08)]'
        : activeWorld.theme === 'cyberpunk'
        ? 'hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(6,182,212,0.08)]'
        : 'hover:border-orange-500/40 hover:shadow-[0_0_25px_rgba(249,115,22,0.08)]'
    }`}>
      {/* Decorative backdrop mesh */}
      <div className={`absolute right-0 top-0 -z-10 h-32 w-32 blur-2xl ${
        activeWorld.theme === 'cyberpunk' ? 'bg-cyan-500/5' :
        activeWorld.theme === 'steampunk' ? 'bg-orange-500/5' :
        'bg-[#7B4FCC]/5'
      }`} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Compass className={
            activeWorld.theme === 'cyberpunk' ? 'text-cyan-400' :
            activeWorld.theme === 'steampunk' ? 'text-orange-400' :
            'text-[#a78bfa]'
          } />
          <h2 className="text-xl font-bold text-zinc-100">
            World Architect
          </h2>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">
          AI World Gen
        </span>
      </div>

      {/* Selected World Overview — flashes on successful forge */}
      <motion.div
        key={flashKey}
        initial={flashKey > 0 ? { scale: 1.02, boxShadow: activeWorld.theme === 'cyberpunk' ? '0 0 40px rgba(6,182,212,0.35)' : activeWorld.theme === 'steampunk' ? '0 0 40px rgba(249,115,22,0.35)' : '0 0 40px rgba(123,79,204,0.35)' } : false}
        animate={{ scale: 1, boxShadow: '0 0 0px rgba(0,0,0,0)' }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className={`mt-6 rounded-2xl border bg-zinc-900/30 p-4 transition-all duration-700 ${
          forgeToast ? themeFlash : 'border-zinc-800'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[9px] uppercase tracking-widest text-zinc-550 font-semibold">Active Realm</span>
            <h4 className="text-lg font-black text-zinc-200 truncate">{activeWorld.name}</h4>
            {/* Custom Realm badge */}
            {isCustomRealm && (
              <span className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                activeWorld.theme === 'cyberpunk' ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300' :
                activeWorld.theme === 'steampunk' ? 'border-orange-500/30 bg-orange-500/10 text-orange-300' :
                'border-[#7B4FCC]/30 bg-[#7B4FCC]/10 text-[#c4b5fd]'
              }`}>
                <Sparkles size={8} />
                AI Custom Realm
              </span>
            )}
          </div>
          <div className="shrink-0 flex items-center gap-2 rounded-xl bg-green-500/10 px-3 py-1.5 border border-green-500/20 text-xs font-semibold text-green-400">
            <Zap size={12} className="animate-pulse" />
            {stability}% Stability
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
            <span>Realm Coherence</span>
            <span>Steady</span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
            <motion.div
              animate={{ width: `${stability}%` }}
              transition={{ duration: 1 }}
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
            />
          </div>
        </div>
      </motion.div>

      {/* Success Toast — appears after successful forge */}
      <AnimatePresence>
        {forgeToast && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="mt-3 flex items-start gap-3 rounded-2xl border border-green-500/25 bg-green-500/8 px-4 py-3"
          >
            <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-green-400" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-green-300">Realm Forged Successfully!</p>
              <p className="text-[11px] text-green-400/80 mt-0.5 leading-relaxed">
                <span className="font-semibold text-green-300">&quot;{forgeToast.name}&quot;</span> is now your active realm. Your quests will be set in this world.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Theme Selector Portals */}
      <div className="mt-6 space-y-3">
        <span className="text-xs font-bold text-zinc-400 block mb-2">Summon Core Themes</span>
        <div className="grid gap-3 sm:grid-cols-3">
          {themes.map((theme) => {
            const isActive = activeWorld.theme === theme.id && activeWorld.name === worldTemplates[theme.id as 'fantasy' | 'cyberpunk' | 'steampunk'].name
            const IconComponent = theme.icon
            return (
              <button
                key={theme.id}
                onClick={() => onChangeWorld(theme.id as any)}
                className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all duration-300 hover:scale-102 hover:border-zinc-700 active:scale-95 ${
                  isActive ? theme.activeColor : `${theme.color} hover:bg-zinc-900/10`
                }`}
              >
                <IconComponent size={22} className="mb-2" />
                <span className="text-xs font-bold">{theme.label}</span>
                <span className="text-[9px] text-zinc-500 mt-1 line-clamp-2 leading-tight">
                  {theme.desc}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Prompt Bar to Forge Custom Realm */}
      <form onSubmit={handleCustomSubmit} className="mt-6 border-t border-zinc-800/80 pt-6">
        <span className="text-xs font-bold text-zinc-400 block mb-2">Forge a Custom Realm</span>
        <div className="flex gap-2">
          <input
            name="worldPrompt"
            type="text"
            disabled={isForging}
            placeholder={isForging ? 'Shaping your realm…' : 'e.g., A floating clockwork observatory in a nebula...'}
            className={`flex-1 rounded-xl border border-zinc-850 bg-black/40 px-4 py-2.5 text-xs placeholder-zinc-550 outline-none transition disabled:opacity-50 disabled:cursor-not-allowed ${
              activeWorld.theme === 'cyberpunk' ? 'focus:border-cyan-500/50' :
              activeWorld.theme === 'steampunk' ? 'focus:border-orange-500/50' :
              'focus:border-[#7B4FCC]/50'
            }`}
          />
          <button
            type="submit"
            disabled={isForging}
            className={`flex items-center gap-1 rounded-xl px-4 text-xs font-bold transition active:scale-95 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              activeWorld.theme === 'cyberpunk' ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 disabled:hover:bg-cyan-500/20' :
              activeWorld.theme === 'steampunk' ? 'bg-orange-500/20 border border-orange-500/30 text-orange-350 hover:bg-orange-500/30 disabled:hover:bg-orange-500/20' :
              'bg-[#7B4FCC]/20 border border-[#7B4FCC]/30 text-[#c4b5fd] hover:bg-[#7B4FCC]/30 disabled:hover:bg-[#7B4FCC]/20'
            }`}
          >
            {isForging ? (
              <>
                <svg className="animate-spin" width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                <span>Forging…</span>
              </>
            ) : (
              <>
                <Sparkles size={12} />
                <span>Forge</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
