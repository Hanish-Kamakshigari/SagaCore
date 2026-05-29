'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Calendar, Compass, Feather } from 'lucide-react'
import { LoreChapter } from '../lib/data'

interface LoreCodexProps {
  chapters: LoreChapter[]
}

export default function LoreCodex({ chapters }: LoreCodexProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950/50 p-6 backdrop-blur-xl">
      {/* Background glowing particles simulation */}
      <div className="absolute left-0 top-0 -z-10 h-32 w-32 bg-purple-500/5 blur-3xl animate-pulse" />
      <div className="absolute right-0 bottom-0 -z-10 h-32 w-32 bg-indigo-500/5 blur-3xl animate-pulse" />

      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <BookOpen className="text-purple-400" />
          <h2 className="text-xl font-bold text-zinc-100">
            Evolving Lore Codex
          </h2>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-zinc-900 border border-zinc-800 px-3 py-1 text-xs text-zinc-400">
          <Feather size={12} className="text-purple-400" />
          <span>{chapters.length} Chapters</span>
        </div>
      </div>

      {/* Chapters list */}
      <div className="mt-6 max-h-[500px] overflow-y-auto pr-1 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <AnimatePresence initial={false}>
          {chapters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-550">
              <Compass size={32} className="mb-3 animate-spin-slow opacity-30 text-purple-400" />
              <h4 className="font-bold text-zinc-400">Your Story Lies Blank</h4>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">
                Complete quests around the realm to watch SAGACORE dynamically scribe legendary chapters of your achievements!
              </p>
            </div>
          ) : (
            [...chapters].reverse().map((chapter, index) => (
              <motion.div
                key={`${chapter.id}-${index}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                className="relative overflow-hidden rounded-2xl border border-zinc-850 bg-gradient-to-b from-zinc-900/40 to-zinc-950/60 p-6 shadow-md transition-all duration-300 hover:border-zinc-800 hover:bg-zinc-900/50"
              >
                {/* Floating chapter watermark banner */}
                <div className="absolute -right-6 -top-6 text-7xl font-black text-zinc-800/10 font-mono select-none">
                  #{chapter.id}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] uppercase tracking-widest text-purple-400 font-mono font-bold">
                      Legendary Chronicle
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                      <Calendar size={10} />
                      <span>{chapter.timestamp}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-zinc-200 mt-1 pr-12 leading-snug">
                    {chapter.title}
                  </h3>

                  <p className="mt-4 text-sm text-zinc-400 leading-relaxed font-serif tracking-wide text-justify italic">
                    {chapter.text}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
