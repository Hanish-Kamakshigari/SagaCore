'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Scroll, Compass } from 'lucide-react'

interface LoreFeedProps {
  lore: string[]
  theme?: 'fantasy' | 'cyberpunk' | 'steampunk'
}

export default function LoreFeed({ lore, theme = 'fantasy' }: LoreFeedProps) {
  const styles = {
    fantasy: {
      iconColor: 'text-[#a78bfa]',
      indicatorBg: 'bg-[#7B4FCC]/50',
      tagColor: 'text-[#a78bfa]/80',
      hoverGlow: 'hover:border-[#7B4FCC]/40 hover:shadow-[0_0_25px_rgba(123,79,204,0.08)]',
    },
    cyberpunk: {
      iconColor: 'text-cyan-400',
      indicatorBg: 'bg-cyan-500/50',
      tagColor: 'text-cyan-400/80',
      hoverGlow: 'hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(6,182,212,0.08)]',
    },
    steampunk: {
      iconColor: 'text-orange-400',
      indicatorBg: 'bg-orange-500/50',
      tagColor: 'text-orange-400/80',
      hoverGlow: 'hover:border-orange-500/40 hover:shadow-[0_0_25px_rgba(249,115,22,0.08)]',
    },
  }[theme]

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950/50 p-6 backdrop-blur-xl transition-all duration-500 ${styles.hoverGlow}`}>
      <div className="flex items-center gap-3">
        <Scroll className={styles.iconColor} />
        <h2 className="text-xl font-bold text-zinc-100 font-cinzel">
          Chronicles of the Realm
        </h2>
      </div>

      <div className="mt-6 max-h-[350px] overflow-y-auto pr-1 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <AnimatePresence initial={false}>
          {lore.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-500">
              <Compass size={24} className="mb-2 animate-spin-slow opacity-40" />
              <p className="text-xs font-mono">No entries in the celestial logs yet.</p>
            </div>
          ) : (
            lore.map((item, index) => (
              <motion.div
                key={`${item}-${index}`}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                className="relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-4 text-sm text-zinc-300 hover:border-zinc-700/60 hover:bg-zinc-900/40 transition-colors"
              >
                <div className={`absolute left-0 top-0 h-full w-[2px] ${styles.indicatorBg}`} />
                <div className="flex justify-between items-start gap-3">
                  <p className="leading-relaxed font-medium">{item}</p>
                  <span className={`text-[9px] font-mono uppercase tracking-widest shrink-0 mt-0.5 ${styles.tagColor}`}>
                    Logged
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}