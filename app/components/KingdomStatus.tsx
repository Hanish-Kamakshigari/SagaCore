'use client'

import { motion } from 'framer-motion'
import { BookOpen, Sword, Sparkles, ShieldCheck } from 'lucide-react'
import { Quest, World } from '../lib/data'

interface KingdomStatusProps {
  quests?: Quest[]
  activeWorld?: World
}

export default function KingdomStatus({ quests = [], activeWorld }: KingdomStatusProps) {
  // Helper to calculate percentages dynamically
  const getCategoryPct = (cat: 'wisdom' | 'discipline' | 'creation') => {
    const categoryQuests = quests.filter((q) => q.category === cat)
    if (categoryQuests.length === 0) return 15 // stable starting baseline

    const completed = categoryQuests.filter((q) => q.isCompleted && !q.failed)
    // Scale from 15% starting base to 100% full completion
    return Math.max(15, Math.round((completed.length / categoryQuests.length) * 100))
  }

  const wisdomName = activeWorld?.pillars?.wisdomName || 'Wisdom'
  const disciplineName = activeWorld?.pillars?.disciplineName || 'Discipline'
  const creationName = activeWorld?.pillars?.creationName || 'Creation'

  const stats = [
    {
      name: wisdomName,
      value: getCategoryPct('wisdom'),
      icon: BookOpen,
      color: 'bg-cyan-500',
      textColor: 'text-cyan-400',
      glow: 'shadow-[0_0_10px_rgba(6,182,212,0.4)]',
      barBg: 'bg-cyan-950/30',
      description: 'Understanding of systems & DSA concepts',
    },
    {
      name: disciplineName,
      value: getCategoryPct('discipline'),
      icon: Sword,
      color: 'bg-orange-500',
      textColor: 'text-orange-400',
      glow: 'shadow-[0_0_10px_rgba(249,115,22,0.4)]',
      barBg: 'bg-orange-950/30',
      description: 'Daily consistency & habit integrity',
    },
    {
      name: creationName,
      value: getCategoryPct('creation'),
      icon: Sparkles,
      color: 'bg-purple-500',
      textColor: 'text-purple-400',
      glow: 'shadow-[0_0_10px_rgba(168,85,247,0.4)]',
      barBg: 'bg-purple-950/30',
      description: 'AI integration & feature implementation',
    },
  ]

  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950/50 p-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <ShieldCheck className="text-purple-400" />
        <h2 className="text-xl font-bold text-zinc-100">
          Sanctuary Pillars
        </h2>
      </div>

      <div className="mt-6 space-y-6">
        {stats.map((stat) => {
          const IconComponent = stat.icon
          return (
            <div key={stat.name} className="group">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`rounded-lg p-1.5 bg-zinc-900 border border-zinc-800 ${stat.textColor}`}>
                    <IconComponent size={14} />
                  </div>
                  <div>
                    <span className="font-bold text-zinc-200">{stat.name}</span>
                    <span className="ml-2 hidden text-[10px] text-zinc-500 group-hover:inline">
                      — {stat.description}
                    </span>
                  </div>
                </div>
                <span className={`font-mono font-bold ${stat.textColor}`}>
                  {stat.value}%
                </span>
              </div>

              <div className={`mt-2.5 h-3.5 w-full overflow-hidden rounded-full ${stat.barBg} border border-zinc-900`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.value}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className={`h-full rounded-full ${stat.color} ${stat.glow} relative`}
                >
                  {/* Subtle diagonal stripe highlight */}
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:8px_8px] opacity-35" />
                </motion.div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
