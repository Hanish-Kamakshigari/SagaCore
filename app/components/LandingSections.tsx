'use client'

import { motion } from 'framer-motion'
import { Cpu, BookOpen, Shield, Flame } from 'lucide-react'
import AetherCore from './AetherCore'


// --- Animation helper ---
const fadeInVariant = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
}

export default function LandingSections() {
  return (
    <div className="bg-black text-white relative z-20">
      
      {/* ─── FEATURES SECTION ─── */}
      <section id="features" className="relative py-28 px-6 max-w-7xl mx-auto border-t border-zinc-900">
        {/* Decorative background glow */}
        <div className="absolute right-0 top-1/4 -z-10 h-96 w-96 rounded-full bg-red-950/15 blur-[150px] pointer-events-none" />
        
        <div className="text-center mb-20">

          <motion.h2 
            {...fadeInVariant}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="text-4xl font-extrabold tracking-tight md:text-5xl font-cinzel bg-gradient-to-b from-white via-zinc-150 to-zinc-400 bg-clip-text text-transparent"
          >
            Engineered For Legendaries
          </motion.h2>
          <motion.p 
            {...fadeInVariant}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mt-4 text-zinc-400 max-w-2xl mx-auto text-base leading-relaxed"
          >
            SAGACORE’s multi-layered intelligence engine parses your daily productivity goals and forges detailed, real-time legendary progression matrices.
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          
          {/* Card 1 */}
          <motion.div 
            {...fadeInVariant}
            whileHover={{ y: -6, borderColor: 'rgba(220, 38, 38, 0.3)' }}
            className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/40 p-8 transition-all duration-300 backdrop-blur-md"
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 group-hover:scale-110 transition-transform duration-300">
              <Cpu size={22} />
            </div>
            <h3 className="text-xl font-bold text-zinc-100 group-hover:text-white transition-colors font-cinzel">
              The Dream Forge
            </h3>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
              Generates customized 3-part quest campaigns from your raw goals, utilizing Google&apos;s advanced Gemini intelligence models.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            {...fadeInVariant}
            transition={{ delay: 0.1, duration: 0.8 }}
            whileHover={{ y: -6, borderColor: 'rgba(249, 115, 22, 0.3)' }}
            className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/40 p-8 transition-all duration-300 backdrop-blur-md"
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/5 text-orange-400 group-hover:scale-110 transition-transform duration-300">
              <BookOpen size={22} />
            </div>
            <h3 className="text-xl font-bold text-zinc-100 group-hover:text-white transition-colors font-cinzel">
              Adaptive Narrator
            </h3>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
              Scribes custom-forged world changes and detailed mythological lore logs based on your quest completion and failures.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            {...fadeInVariant}
            transition={{ delay: 0.2, duration: 0.8 }}
            whileHover={{ y: -6, borderColor: 'rgba(220, 38, 38, 0.3)' }}
            className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/40 p-8 transition-all duration-300 backdrop-blur-md"
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 group-hover:scale-110 transition-transform duration-300">
              <Shield size={22} />
            </div>
            <h3 className="text-xl font-bold text-zinc-100 group-hover:text-white transition-colors font-cinzel">
              Evolving Codex
            </h3>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
              A chronological history cataloging every milestone, event, and custom forged realm generated throughout your journey.
            </p>
          </motion.div>

          {/* Card 4 */}
          <motion.div 
            {...fadeInVariant}
            transition={{ delay: 0.3, duration: 0.8 }}
            whileHover={{ y: -6, borderColor: 'rgba(249, 115, 22, 0.3)' }}
            className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/40 p-8 transition-all duration-300 backdrop-blur-md"
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/5 text-orange-400 group-hover:scale-110 transition-transform duration-300">
              <Flame size={22} />
            </div>
            <h3 className="text-xl font-bold text-zinc-100 group-hover:text-white transition-colors font-cinzel">
              Memory Engine
            </h3>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
              Integrates persistent MongoDB MCP layer to securely save active quests, player levels, experience, and custom worlds.
            </p>
          </motion.div>

        </div>
      </section>

      {/* ─── ABOUT SECTION ─── */}
      <section id="about" className="relative py-28 px-6 max-w-7xl mx-auto border-t border-zinc-900 overflow-hidden">
        {/* Background ambient orbs */}
        <div className="absolute left-0 bottom-0 -z-10 h-[500px] w-[500px] rounded-full bg-red-950/10 blur-[180px] pointer-events-none" />
        
        <div className="grid gap-16 lg:grid-cols-12 items-center">
          
          {/* Left Block - Text */}
          <div className="lg:col-span-6">
            <motion.h2 
              {...fadeInVariant}
              transition={{ delay: 0.1, duration: 0.8 }}
              className="text-4xl font-extrabold tracking-tight md:text-5xl font-cinzel leading-tight"
            >
              Real Ambition.<br />Evolving Legends.
            </motion.h2>

            <motion.p 
              {...fadeInVariant}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="mt-6 text-zinc-400 text-lg leading-relaxed"
            >
              At SAGACORE Hub, we believe that tracking tasks and leveling up shouldn&apos;t be a tedious chore. We transform your real-world progress into a living epic saga. 
            </motion.p>
            
            <motion.p 
              {...fadeInVariant}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="mt-4 text-zinc-400 text-base leading-relaxed"
            >
              Every time you create and complete a productivity or personal goal, our World Engine channels AI models to formulate structured quest lines, assess difficulties, and generate custom narrative chronicles. Level up your skills, stabilize your forged realms, and let your achievements echo in the halls of history.
            </motion.p>
          </div>

          {/* Right Block - Interactive Aether Core Companion */}
          <div className="lg:col-span-6 flex items-center justify-center">
            <AetherCore />
          </div>
        </div>

        {/* secondary attributes grid row */}
        <div className="mt-20 grid gap-6 md:grid-cols-3">
          
          {/* Stat Item 1 */}
          <motion.div 
            {...fadeInVariant}
            whileHover={{ scale: 1.02 }}
            className="flex items-start gap-5 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 backdrop-blur-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 font-bold font-mono">
              I
            </div>
            <div>
              <h4 className="text-lg font-bold text-zinc-100 font-cinzel">Wisdom Attributes</h4>
              <p className="mt-1 text-sm text-zinc-400 leading-relaxed">
                Refining technical mastery, algorithm studies, deep research, and conceptual code architecture.
              </p>
            </div>
          </motion.div>

          {/* Stat Item 2 */}
          <motion.div 
            {...fadeInVariant}
            transition={{ delay: 0.1, duration: 0.8 }}
            whileHover={{ scale: 1.02 }}
            className="flex items-start gap-5 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 backdrop-blur-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold font-mono">
              II
            </div>
            <div>
              <h4 className="text-lg font-bold text-zinc-100 font-cinzel">Discipline Columns</h4>
              <p className="mt-1 text-sm text-zinc-400 leading-relaxed">
                Tracking consistency, task management, regression logs, physical stability, and continuous endurance.
              </p>
            </div>
          </motion.div>

          {/* Stat Item 3 */}
          <motion.div 
            {...fadeInVariant}
            transition={{ delay: 0.2, duration: 0.8 }}
            whileHover={{ scale: 1.02 }}
            className="flex items-start gap-5 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 backdrop-blur-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold font-mono">
              III
            </div>
            <div>
              <h4 className="text-lg font-bold text-zinc-100 font-cinzel">Creation Forges</h4>
              <p className="mt-1 text-sm text-zinc-400 leading-relaxed">
                Building frontends, designing databases, drafting mockups, deploying modules, and forging visual layouts.
              </p>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ─── ROADMAP SECTION ─── */}
      <section id="roadmap" className="relative py-28 px-6 max-w-7xl mx-auto border-t border-zinc-900">
        {/* Decorative background glow */}
        <div className="absolute right-10 bottom-10 -z-10 h-80 w-80 rounded-full bg-red-950/10 blur-[150px] pointer-events-none" />

        <div className="text-center mb-20">
          <motion.h2 
            {...fadeInVariant}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="text-4xl font-extrabold tracking-tight md:text-5xl font-cinzel"
          >
            Roadmap of The Engine
          </motion.h2>
          <motion.p 
            {...fadeInVariant}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mt-4 text-zinc-400 max-w-2xl mx-auto text-base leading-relaxed"
          >
            The chronicle of MythicGrid development milestones, charting our evolution from a standalone console into a globally synchronized world network.
          </motion.p>
        </div>

        {/* Timeline container */}
        <div className="relative max-w-4xl mx-auto pl-8 border-l border-zinc-800 space-y-16">
          
          {/* Timeline Item 1 */}
          <motion.div 
            {...fadeInVariant}
            className="relative"
          >
            {/* Chronology Dot */}
            <div className="absolute -left-[41px] top-1.5 h-5 w-5 rounded-full border border-red-500/40 bg-zinc-950 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-red-500" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
              <span className="text-xs font-mono font-bold tracking-widest text-red-400 uppercase">
                Phase 01 · Genesis Core
              </span>
              <span className="inline-flex items-center rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-red-300 tracking-wider w-fit">
                COMPLETED
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-zinc-200 mt-2 font-cinzel">Gemini & Interface Sync</h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed max-w-2xl">
              Completed Google Gemini endpoint bindings, fluid glassmorphic header integrations, stable multi-theme switching frameworks, and dynamic animation configurations.
            </p>
          </motion.div>

          {/* Timeline Item 2 */}
          <motion.div 
            {...fadeInVariant}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="relative"
          >
            {/* Chronology Dot */}
            <div className="absolute -left-[41px] top-1.5 h-5 w-5 rounded-full border border-orange-500/40 bg-zinc-950 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-orange-500" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
              <span className="text-xs font-mono font-bold tracking-widest text-orange-400 uppercase">
                Phase 02 · Chronicle Update
              </span>
              <span className="inline-flex items-center rounded-full bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-orange-300 tracking-wider w-fit">
                COMPLETED
              </span>
            </div>

            <h3 className="text-xl font-bold text-zinc-200 mt-2 font-cinzel">Persistent Memory Grids</h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed max-w-2xl">
              Implemented secure MongoDB MCP memory layers to persistently save forged realms, quest status cards, task checklists, and comprehensive player codex chapter logs.
            </p>
          </motion.div>

          {/* Timeline Item 3 */}
          <motion.div 
            {...fadeInVariant}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="relative"
          >
            {/* Chronology Dot */}
            <div className="absolute -left-[41px] top-1.5 h-5 w-5 rounded-full border border-rose-500/40 bg-zinc-950 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
              <span className="text-xs font-mono font-bold tracking-widest text-rose-400 uppercase">
                Phase 03 · Nexus Campaigns
              </span>
              <span className="inline-flex items-center rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-rose-300 tracking-wider w-fit">
                IN PROGRESS
              </span>
            </div>

            <h3 className="text-xl font-bold text-zinc-200 mt-2 font-cinzel">Multiplayer World Sharing</h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed max-w-2xl">
              Currently adding support for cooperative player parties and live leaderboard statistics.
            </p>
          </motion.div>

          {/* Timeline Item 4 */}
          <motion.div 
            {...fadeInVariant}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="relative"
          >
            {/* Chronology Dot */}
            <div className="absolute -left-[41px] top-1.5 h-5 w-5 rounded-full border border-zinc-800 bg-zinc-950 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-zinc-800" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
              <span className="text-xs font-mono font-bold tracking-widest text-zinc-500 uppercase">
                Phase 04 · Sovereign Mint
              </span>
              <span className="inline-flex items-center rounded-full bg-zinc-900 border border-zinc-850 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-400 tracking-wider w-fit">
                PLANNED
              </span>
            </div>

            <h3 className="text-xl font-bold text-zinc-200 mt-2 font-cinzel">Sovereign Proof-of-Action</h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed max-w-2xl">
              Integrating accomplishment proofs on sovereign decentralized ledgers, complete offline soundscape generators, and iOS/Android companion applications.
            </p>
          </motion.div>

        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-zinc-900 py-12 px-6 bg-zinc-950/20 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center sm:items-start select-none">
            <span className="text-lg font-black tracking-widest text-white font-cinzel">
              SAGACORE HUB
            </span>
            <span className="text-[8px] uppercase tracking-widest text-red-400 font-bold font-mono">
              World Engine
            </span>
          </div>
          <p className="text-xs text-zinc-600 font-mono">
            © 2026 SagaCore Hub · All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  )
}
