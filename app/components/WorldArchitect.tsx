'use client'

import { motion } from 'framer-motion'
import { Compass, Sparkles, AlertCircle, RefreshCw, Zap, Sword, Cog, Cpu } from 'lucide-react'
import { World } from '../lib/data'

interface WorldArchitectProps {
  activeWorld: World
  onChangeWorld: (theme: 'fantasy' | 'cyberpunk' | 'steampunk') => void
  onForgeCustomWorld: (prompt: string) => void
}

export default function WorldArchitect({
  activeWorld,
  onChangeWorld,
  onForgeCustomWorld,
}: WorldArchitectProps) {
  const themes = [
    {
      id: 'fantasy',
      label: 'Aether Fantasy',
      desc: 'Glowing scrolls, mana spires, and bug serpents.',
      icon: Sword,
      color: 'border-purple-500/30 text-purple-400 bg-purple-500/5',
      activeColor: 'border-purple-500/80 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.3)] text-purple-300',
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
      activeColor: 'border-orange-500/80 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.3)] text-orange-300',
    },
  ]

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const input = form.elements.namedItem('worldPrompt') as HTMLInputElement
    if (input && input.value.trim()) {
      onForgeCustomWorld(input.value.trim())
      form.reset()
    }
  }

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950/50 p-6 backdrop-blur-xl transition-all duration-500 ${
      activeWorld.theme === 'fantasy' ? 'hover:border-purple-500/40 hover:shadow-[0_0_25px_rgba(168,85,247,0.08)]' : activeWorld.theme === 'cyberpunk' ? 'hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(6,182,212,0.08)]' : 'hover:border-orange-500/40 hover:shadow-[0_0_25px_rgba(249,115,22,0.08)]'
    }`}>
      {/* Decorative backdrop mesh */}
      <div className="absolute right-0 top-0 -z-10 h-32 w-32 bg-purple-500/5 blur-2xl" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Compass className="text-purple-400" />
          <h2 className="text-xl font-bold text-zinc-100">
            World Architect
          </h2>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">
          AI World Gen
        </span>
      </div>

      {/* Selected World Overview */}
      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-semibold">Active Realm</span>
            <h4 className="text-lg font-black text-zinc-200">{activeWorld.name}</h4>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-green-500/10 px-3 py-1.5 border border-green-500/20 text-xs font-semibold text-green-400">
            <Zap size={12} className="animate-pulse" />
            {activeWorld.stability}% Stability
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
            <span>Realm Coherence</span>
            <span>Steady</span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
            <motion.div
              animate={{ width: `${activeWorld.stability}%` }}
              transition={{ duration: 1 }}
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
            />
          </div>
        </div>
      </div>

      {/* Theme Selector Portals */}
      <div className="mt-6 space-y-3">
        <span className="text-xs font-bold text-zinc-400 block mb-2">Summon Core Themes</span>
        <div className="grid gap-3 sm:grid-cols-3">
          {themes.map((theme) => {
            const isActive = activeWorld.theme === theme.id
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
            placeholder="e.g., A floating clockwork observatory in a nebula..."
            className="flex-1 rounded-xl border border-zinc-850 bg-black/40 px-4 py-2.5 text-xs placeholder-zinc-550 outline-none transition focus:border-purple-500/50"
          />
          <button
            type="submit"
            className="flex items-center gap-1 rounded-xl bg-purple-500/20 border border-purple-500/30 px-4 text-xs font-bold text-purple-300 transition hover:bg-purple-500/30 active:scale-95"
          >
            <Sparkles size={12} />
            <span>Forge</span>
          </button>
        </div>
      </form>
    </div>
  )
}
