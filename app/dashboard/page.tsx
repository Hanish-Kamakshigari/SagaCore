'use client'

// dashboard/page.tsx — patched with three engine integrations:
//   1. Dream Engine: forgeQuestWithAI() replaces forgeQuestFromGoal()
//   2. Adaptive AI Engine: generateAdaptiveChapter() replaces generateLoreChapter()
//      + narrateWorldChange fires per quest completion/failure
//   3. Memory Engine: MongoDB MCP saves quests, chapters, player state
//
// Everything else (XPBar, KingdomStatus, WorldArchitect, LoreFeed, LoreCodex,
// filtering, level-up modal, theme switching) is UNCHANGED from your original.

import { useState, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowLeft, Send, Sparkle, Award, Compass, BookOpen, Scroll as ScrollIcon, Loader2, Volume2, VolumeX } from 'lucide-react'

import KingdomStatus from '../components/KingdomStatus'
import LoreFeed from '../components/LoreFeed'
import QuestCard from '../components/QuestCard'
import XPBar from '../components/XPbar'
import WorldArchitect from '../components/WorldArchitect'
import LoreCodex from '../components/LoreCodex'

import { usePersistentState } from '../hooks/usePersistentState'
import { useAmbientAudio } from '../hooks/useAmbientAudio'

import {
  quests as initialQuests,
  worldTemplates,
  Quest,
  World,
  LoreChapter,
} from '@/app/lib/data'

import {
  forgeQuestWithAI,
  generateAdaptiveChapter,
  forgeCustomWorldWithAI,
  saveQuestToMongo,
  saveChapterToMongo,
  savePlayerStateToMongo,
  generateRoadmapForQuest,
  forgeQuestlineWithAI,
} from '@/app/lib/ai'


// Stable player ID — in production, derive from auth session
const PLAYER_ID = 'player_sagacore_default'

export default function Dashboard() {
  const [activeWorld, setActiveWorld] = usePersistentState<World>('activeWorld', worldTemplates.fantasy)
  const [quests, setQuests]           = usePersistentState<Quest[]>('quests', initialQuests)
  const [xp, setXp]                   = usePersistentState<number>('xp', 0)
  const [level, setLevel]             = usePersistentState<number>('level', 1)
  const [lore, setLore]               = usePersistentState<string[]>('lore', [
    'The Ancient Library expands once more under your focus.',
    'The Valley of Distraction has weakened due to your high productivity.',
    'The Fortress of Algorithms has risen, establishing order in the digital realms.',
  ])
  const [chapters, setChapters]       = usePersistentState<LoreChapter[]>('chapters', [])
  const [audioActive, setAudioActive] = usePersistentState<boolean>('audioActive', false)

  // Trigger procedural atmospheric soundscapes
  useAmbientAudio(activeWorld.theme, audioActive)
  const [newGoal, setNewGoal]               = useState('')
  const [filter, setFilter]                 = useState<'all' | 'wisdom' | 'discipline' | 'creation'>('all')
  const [showLevelUp, setShowLevelUp]       = useState(false)
  const [justLeveledTo, setJustLeveledTo]   = useState(1)
  const [activeTab, setActiveTab]           = useState<'quests' | 'codex'>('quests')

  // ── Loading states for the three AI engines ──────────────────────────────
  const [isForging, setIsForging]       = useState(false)   // Dream Engine
  const [narratingId, setNarratingId]   = useState<number | null>(null) // Adaptive AI Engine
  const [generatingRoadmapId, setGeneratingRoadmapId] = useState<number | null>(null) // Roadmap generation tracker
  const [narratedEvents, setNarratedEvents] = useState<Record<number, string>>({}) // per-quest narrated myth

  const goalInputRef = useRef<HTMLInputElement>(null)

  // ── Theme colours (unchanged from original) ────────────────────────────────
  const themeColors = {
    fantasy:   { radialGlow: 'bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.06),transparent_60%)]',  borderGlow: 'border-purple-500/20', activeText: 'text-purple-400', accentBg: 'bg-purple-500/10 border-purple-500/20 text-purple-300',  btnBg: 'from-purple-500 to-indigo-500'  },
    cyberpunk: { radialGlow: 'bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.06),transparent_60%)]',   borderGlow: 'border-cyan-500/20',   activeText: 'text-cyan-400',   accentBg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300',     btnBg: 'from-cyan-500 to-blue-500'      },
    steampunk: { radialGlow: 'bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.06),transparent_60%)]',  borderGlow: 'border-orange-500/20', activeText: 'text-orange-400', accentBg: 'bg-orange-500/10 border-orange-500/20 text-orange-350', btnBg: 'from-orange-500 to-amber-500'   },
  }
  const colors = themeColors[activeWorld.theme]

  // ── World switching (unchanged logic, but now uses AI for custom worlds) ──
  const handleChangeWorld = (theme: 'fantasy' | 'cyberpunk' | 'steampunk') => {
    const nextWorld = worldTemplates[theme]
    setActiveWorld(nextWorld)
    setLore((prev) => [`🔮 REALM SHIFT: Now entering: "${nextWorld.name}"`, ...prev])
  }

  // ── Custom world forge — now calls Gemini instead of keyword-matching ──────
  const handleForgeCustomWorld = async (prompt: string) => {
    // Optimistic UI update with prompt as placeholder name
    setLore((prev) => [`🌀 World Architect is shaping: "${prompt}"…`, ...prev])

    try {
      const result = await forgeCustomWorldWithAI(prompt)
      const customWorld: World = {
        theme: result.theme,
        name: result.name,
        stability: 100,
        pillars: worldTemplates[result.theme].pillars,
      }
      setActiveWorld(customWorld)
      setLore((prev) => [
        `🌀 WORLD FORGE: Reality grids aligned for "${result.name}" — ${result.lore}`,
        ...prev.slice(1), // remove the placeholder
      ])
    } catch (err) {
      console.warn('World Architect AI failed, triggering local fallback:', err)
      
      const text = prompt.toLowerCase()
      let theme: 'fantasy' | 'cyberpunk' | 'steampunk' = 'fantasy'
      if (text.includes('cyber') || text.includes('neon') || text.includes('digital') || text.includes('hack')) {
        theme = 'cyberpunk'
      } else if (text.includes('steam') || text.includes('gear') || text.includes('clock') || text.includes('piston')) {
        theme = 'steampunk'
      }

      const fallbackWorld: World = {
        theme,
        name: prompt.length > 25 ? `${prompt.substring(0, 25)}...` : prompt,
        stability: 100,
        pillars: worldTemplates[theme].pillars,
      }

      setActiveWorld(fallbackWorld)
      setLore((prev) => [
        `🌀 WORLD FORGE: Reality grids aligned for custom world: "${fallbackWorld.name}"!`,
        ...prev.slice(1), // remove the placeholder
      ])
    }
  }

  // ── Dream Engine: forge quest with Gemini AI ───────────────────────────────
  const handleForgeQuest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGoal.trim() || isForging) return

    setIsForging(true)
    goalInputRef.current?.blur()

    try {
      const startId = quests.length + 1
      const generatedCampaign = await forgeQuestlineWithAI(newGoal, startId, activeWorld.theme)

      // Prepend all 3 sequential campaign quests to state
      setQuests((prev) => [...generatedCampaign, ...prev])
      setNewGoal('')

      setLore((prev) => [
        `☄️ Dream Forge aligned reality for a 3-part campaign: "${newGoal}"!`,
        `Quest 1 (Wisdom): "${generatedCampaign[0].title}"`,
        `Quest 2 (Creation): "${generatedCampaign[1].title}"`,
        `Quest 3 (Discipline): "${generatedCampaign[2].title}"`,
        ...prev,
      ])

      // Persist all 3 quests to MongoDB via Memory Engine
      await Promise.allSettled(generatedCampaign.map((q) => saveQuestToMongo(q))).catch(() => {
        console.warn('MongoDB campaign save failed')
      })
    } catch (err) {
      console.warn('Dream Engine AI failed, triggering local fallback:', err)
      
      const { forgeQuestFromGoal } = await import('../lib/data')
      const newId = quests.length + 1
      const fallbackQuest = forgeQuestFromGoal(newGoal, newId)
      const initializedFallback: Quest = {
        ...fallbackQuest,
        completedTasks: fallbackQuest.tasks ? new Array(fallbackQuest.tasks.length).fill(false) : []
      }

      setQuests((prev) => [initializedFallback, ...prev])
      setNewGoal('')

      setLore((prev) => [
        `☄️ Dream Forge conjured: "${initializedFallback.title}" (${initializedFallback.difficulty} · +${initializedFallback.xp} XP)`,
        ...prev,
      ])
    } finally {
      setIsForging(false)
    }
  }

  // ── Quest completion — runs Adaptive AI Engine + Memory Engine ─────────────
  const handleCompleteQuest = async (id: number) => {
    if (narratingId !== null) return
    const questToComplete = quests.find((q) => q.id === id)
    if (!questToComplete || questToComplete.isCompleted) return

    setNarratingId(id)

    // XP + level progression (unchanged logic)
    const questXp    = questToComplete.xp
    const newXpTotal = xp + questXp
    let nextLevel    = level
    let remainingXp  = newXpTotal

    if (remainingXp >= 1000) {
      nextLevel  += 1
      remainingXp = remainingXp - 1000
      setJustLeveledTo(nextLevel)
      setShowLevelUp(true)
      setTimeout(() => setShowLevelUp(false), 5000)
      setLore((prev) => [`✨ CELESTIAL ASCENSION: You have reached Level ${nextLevel}!`, ...prev])
    }

    setXp(remainingXp)
    setLevel(nextLevel)

    // Mark quest complete immediately so UI responds
    setQuests((prev) => prev.map((q) => (q.id === id ? { ...q, isCompleted: true } : q)))

    try {
      // ── Adaptive AI Engine: generate world-change narration ────────────────
      const newChapterId = chapters.length + 1
      const chapter = await generateAdaptiveChapter(
        questToComplete.title,
        questToComplete.category,
        activeWorld.theme,
        newChapterId,
        questToComplete.mythEvent ?? ''
      )

      setChapters((prev) => [...prev, chapter])
      setNarratedEvents((prev) => ({ ...prev, [id]: chapter.text }))

      const categoryEmoji =
        questToComplete.category === 'wisdom' ? '📖' :
        questToComplete.category === 'creation' ? '🔮' : '⚔️'

      setLore((prev) => [
        `${categoryEmoji} Triumph! "${questToComplete.title}" (+${questXp} XP)`,
        `Scribed Chapter ${newChapterId}: "${chapter.title}"`,
        ...prev,
      ])

      // ── Memory Engine: persist chapter and player state ────────────────────
      await Promise.allSettled([
        saveChapterToMongo(chapter),
        savePlayerStateToMongo(PLAYER_ID, remainingXp, nextLevel, activeWorld.theme),
        saveQuestToMongo({ ...questToComplete, isCompleted: true }),
      ])
    } catch (err) {
      console.error('Adaptive Engine failed:', err)
      // Fall back to static chapter generation from the original data.ts
      const { generateLoreChapter } = await import('../lib/data')
      const fallbackChapter = generateLoreChapter(
        questToComplete.title,
        questToComplete.category,
        activeWorld.theme,
        chapters.length + 1
      )
      setChapters((prev) => [...prev, fallbackChapter])
      setLore((prev) => [
        `⚔️ Quest complete: "${questToComplete.title}" (+${questXp} XP)`,
        ...prev,
      ])
    } finally {
      setNarratingId(null)
    }
  }

  // ── Quest failure — dark world narration ──────────────────────────────────
  const handleFailQuest = async (id: number) => {
    if (narratingId !== null) return
    const quest = quests.find((q) => q.id === id)
    if (!quest || quest.isCompleted) return

    setNarratingId(id)
    setQuests((prev) => prev.map((q) => (q.id === id ? { ...q, isCompleted: true, failed: true } : q)))

    try {
      const newChapterId = chapters.length + 1
      const chapter = await generateAdaptiveChapter(
        quest.title,
        quest.category,
        activeWorld.theme,
        newChapterId,
        `FAILED: ${quest.mythEvent ?? 'The realm grows darker.'}`
      )

      setChapters((prev) => [...prev, chapter])
      setNarratedEvents((prev) => ({ ...prev, [id]: chapter.text }))
      setLore((prev) => [
        `🌑 Darkness spreads: "${quest.title}" was abandoned.`,
        `Shadow Chapter ${newChapterId} etched into the Codex.`,
        ...prev,
      ])

      await Promise.allSettled([
        saveChapterToMongo(chapter),
        saveQuestToMongo({ ...quest, isCompleted: true }),
      ])
    } catch {
      setLore((prev) => [`🌑 Quest abandoned: "${quest.title}" — the realm suffers.`, ...prev])
    } finally {
      setNarratingId(null)
    }
  }

  // ── Quest Roadmap Generation — Unlocks interactive checklists ──────────────
  const handleGenerateRoadmap = async (id: number) => {
    const quest = quests.find((q) => q.id === id)
    if (!quest || quest.tasks) return

    setGeneratingRoadmapId(id)
    try {
      const result = await generateRoadmapForQuest(
        quest.title,
        quest.category,
        quest.difficulty,
        activeWorld.theme
      )

      const updatedQuest: Quest = {
        ...quest,
        tasks: result.tasks,
        completedTasks: new Array(result.tasks.length).fill(false),
        mythEvent: result.mythEvent,
      }

      setQuests((prev) => prev.map((q) => (q.id === id ? updatedQuest : q)))
      setLore((prev) => [
        `🔮 ROADMAP GENERATED: AI has unlocked the sacred roadmap for "${quest.title}"!`,
        ...prev,
      ])

      // Persist to MongoDB via Memory Engine
      await saveQuestToMongo(updatedQuest).catch(() => {
        console.warn('MongoDB quest roadmap save failed')
      })
    } catch (err) {
      console.warn('Roadmap AI generation failed, using local fallback:', err)
      const category = quest.category
      const fallbackTasks = {
        wisdom: [
          'Consult database indexes | Search the ancient library archives',
          'Trace execution runtimes | Consult the sandboxed scrolls',
          'Document system changes | Catalog findings in the chronicle registry',
        ],
        discipline: [
          'Isolate memory leakage logs | Hunt the venomous Bug Serpent',
          'Refactor memory bounds | Forge solid steel gear rods',
          'Deploy regression guards | Set up automated alert watch towers',
        ],
        creation: [
          'Draft layout wireframes | Inscribe the blueprint scrolls',
          'Weld logic modules | Assemble the clockwork piston core',
          'Deploy secure gateways | Safeguard the celestial gates',
        ],
      }[category] || [
        'Prepare environment tools | Gather the rare alchemical ingredients',
        'Execute core protocols | Channel the elemental focus energy',
        'Review final outcomes | Scribe the scroll of completion',
      ]

      const fallbackMythEvent = `The architectural patterns of "${quest.title}" are now permanently integrated into the core system.`

      const updatedQuest: Quest = {
        ...quest,
        tasks: fallbackTasks,
        completedTasks: new Array(fallbackTasks.length).fill(false),
        mythEvent: fallbackMythEvent,
      }

      setQuests((prev) => prev.map((q) => (q.id === id ? updatedQuest : q)))
      setLore((prev) => [
        `🔮 ROADMAP UNLOCKED: Unlocked a legendary manual roadmap for "${quest.title}"!`,
        ...prev,
      ])
    } finally {
      setGeneratingRoadmapId(null)
    }
  }

  // ── Toggle checklist tasks ──────────────────────────────────────────────────
  const handleToggleTask = async (
    questId: number,
    taskIndex: number
  ) => {
    const updatedQuests = quests.map((quest) => {
      if (quest.id !== questId) return quest

      const updatedCompletedTasks = [
        ...(quest.completedTasks || [])
      ]

      updatedCompletedTasks[taskIndex] =
        !updatedCompletedTasks[taskIndex]

      return {
        ...quest,
        completedTasks: updatedCompletedTasks,
      }
    })

    setQuests(updatedQuests)

    const updatedQuest = updatedQuests.find(
      (q) => q.id === questId
    )

    if (updatedQuest) {
      try {
        await saveQuestToMongo(updatedQuest)
      } catch (err) {
        console.error('Failed saving task progress:', err)
      }
    }
  }

  const filteredQuests = quests.filter((q) => filter === 'all' || q.category === filter)

  // ─────────────────────────────────────────────────────────────────────────────
  // Render — identical structure to your original, with two additions:
  //   1. Forge button shows a spinner + disabled state while isForging
  //   2. QuestCard receives onFail, isNarrating, narratedMythEvent props
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <main className="relative min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black px-6 py-8 text-white transition-colors duration-500">
      {/* Dynamic backdrop grid */}
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] opacity-60" />
      <div className={`absolute inset-0 -z-30 transition-all duration-700 ${colors.radialGlow}`} />

      {/* Level Up modal — unchanged */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: -50, opacity: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="relative max-w-md w-full overflow-hidden rounded-3xl border border-yellow-500/30 bg-zinc-950 p-8 text-center shadow-[0_0_50px_rgba(234,179,8,0.2)]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.1),transparent_70%)]" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.3)] animate-bounce mb-6">
                  <Award size={40} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-yellow-400">Realm Ascension</span>
                <h2 className="text-4xl font-extrabold text-white mt-2">LEVEL UP!</h2>
                <p className="mt-4 text-zinc-400">Your actions have echoed across the digital cosmos. You are now:</p>
                <div className="mt-6 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 px-6 py-3 font-mono text-2xl font-black text-yellow-300">
                  Level {justLeveledTo} Creator
                </div>
                <button
                  onClick={() => setShowLevelUp(false)}
                  className="mt-8 rounded-xl bg-white text-black px-6 py-2.5 font-bold hover:bg-zinc-200 transition-colors"
                >
                  Receive Blessing
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-7xl">

        {/* Header — unchanged */}
        <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="group flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-400 transition hover:border-zinc-700 hover:text-white">
              <ArrowLeft size={18} className="transition group-hover:-translate-x-0.5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-ping" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-cinzel">SAGACORE Hub</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl mt-0.5 font-cinzel">
                {activeWorld.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Ambient Soundscape Toggle */}
            <button
              onClick={() => setAudioActive((a) => !a)}
              title="Toggle Ambient Audio Soundscape"
              className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-md transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] hover:cursor-pointer ${
                audioActive
                  ? 'border-purple-500/35 bg-purple-500/10 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                  : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {audioActive ? <Volume2 size={13} className="text-purple-400" /> : <VolumeX size={13} />}
              <span>{audioActive ? 'Synth On' : 'Muted'}</span>
            </button>

            <div className="hidden text-right sm:block">
              <p className="text-xs text-zinc-500">World Engine</p>
              <p className="text-sm font-mono font-semibold text-zinc-300">Architect 0x7c9</p>
            </div>
            <div className="h-10 w-[1px] bg-zinc-800 hidden sm:block" />
            <span className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-md border transition-colors duration-500 ${colors.accentBg}`}>
              {activeWorld.theme} grid active
            </span>
          </div>
        </header>

        {/* XP Bar */}
        <XPBar xp={xp} level={level} />

        {/* Layout grid */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">

          {/* Main column */}
          <div className="space-y-6 lg:col-span-2">

            {/* Dream Forge — only change: button shows spinner when isForging */}
            <div className={`relative overflow-hidden rounded-3xl border ${colors.borderGlow} bg-gradient-to-r from-zinc-900/40 via-zinc-900/20 to-zinc-950/40 p-6 shadow-xl backdrop-blur-xl transition-all duration-500`}>
              <div className="absolute right-4 top-4 text-purple-500/10">
                <Sparkle size={48} className="animate-spin-slow" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Sparkles size={16} className={`${colors.activeText} animate-pulse`} />
                The Dream Forge
              </h3>
              <p className="mt-1 text-sm text-zinc-400">
                Type any ambition. The SAGACORE generator will forge a legendary quest with dynamic XP rewards.
              </p>

              <form onSubmit={handleForgeQuest} className="mt-4 flex gap-3">
                <input
                  ref={goalInputRef}
                  type="text"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  disabled={isForging}
                  placeholder="e.g., study graph theory algorithms, clear gym routines, build user interface..."
                  className="flex-1 rounded-2xl border border-zinc-800 bg-black/40 px-5 py-3 text-sm placeholder-zinc-550 outline-none transition focus:border-zinc-700 focus:bg-black/60 focus:ring-1 focus:ring-purple-500/10 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isForging || !newGoal.trim()}
                  className={`flex items-center gap-2 rounded-2xl bg-gradient-to-r ${colors.btnBg} px-6 font-bold text-white transition hover:brightness-110 active:scale-95 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {isForging ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  <span className="hidden sm:inline">{isForging ? 'Forging…' : 'Forge'}</span>
                </button>
              </form>

              {/* Engine status badge — only visible while forging */}
              <AnimatePresence>
                {isForging && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 overflow-hidden"
                  >
                    <div className="flex items-center gap-2 rounded-xl bg-zinc-900/60 border border-zinc-800 px-4 py-2.5 text-xs text-zinc-400">
                      <Loader2 size={11} className="animate-spin text-purple-400" />
                      <span>
                        {activeWorld.theme === 'fantasy' && 'Dream Engine active — "Reality is but clay in the hands of the scribe." Shaping your destiny…'}
                        {activeWorld.theme === 'cyberpunk' && 'Dream Engine active — "The net flows where ambition directs." Compiling your grid sub-routines…'}
                        {activeWorld.theme === 'steampunk' && 'Dream Engine active — "With enough pressure, even iron learns to bend." Forging the steam seals…'}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tab nav — unchanged */}
            <div className="flex border-b border-zinc-800/80 pb-0.5 gap-4">
              <button
                onClick={() => setActiveTab('quests')}
                className={`relative pb-3 text-sm font-bold uppercase tracking-wider transition ${activeTab === 'quests' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <span className="flex items-center gap-2">
                  <ScrollIcon size={14} />
                  Active Quests
                </span>
                {activeTab === 'quests' && (
                  <motion.div layoutId="activeTabUnderline" className={`absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r ${colors.btnBg}`} />
                )}
              </button>

              <button
                onClick={() => setActiveTab('codex')}
                className={`relative pb-3 text-sm font-bold uppercase tracking-wider transition ${activeTab === 'codex' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <span className="flex items-center gap-2">
                  <BookOpen size={14} />
                  Evolving Codex
                  {chapters.length > 0 && (
                    <span className="rounded-full bg-purple-500/20 border border-purple-500/30 px-1.5 py-0.2 text-[9px] text-purple-300">
                      {chapters.length}
                    </span>
                  )}
                </span>
                {activeTab === 'codex' && (
                  <motion.div layoutId="activeTabUnderline" className={`absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r ${colors.btnBg}`} />
                )}
              </button>
            </div>

            {/* Content tabs */}
            <div>
              {activeTab === 'quests' ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                      Active Quests
                      <span className="rounded-full bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400">
                        {filteredQuests.length}
                      </span>
                    </h2>
                    <div className="flex flex-wrap gap-1 rounded-xl bg-zinc-900/50 p-1 border border-zinc-800/80 max-w-fit">
                      {(['all', 'wisdom', 'discipline', 'creation'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setFilter(t)}
                          className={`rounded-lg px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${filter === t ? 'bg-zinc-800 text-white shadow-inner border border-zinc-700/40' : 'text-zinc-400 hover:text-zinc-200'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredQuests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/20">
                      <Compass size={40} className="text-zinc-600 animate-pulse mb-3" />
                      <h4 className="text-lg font-bold text-zinc-400">No Active Quests in this Category</h4>
                      <p className="text-sm text-zinc-500 mt-1 max-w-xs">Forge a new quest above or reset your filters.</p>
                    </div>
                  ) : (
                    <motion.div layout className="grid gap-6 sm:grid-cols-2">
                      <AnimatePresence mode="popLayout">
                        {filteredQuests.map((quest) => {
                          const isLocked = quest.dependsOnQuestId !== undefined && (() => {
                            const parent = quests.find((pq) => pq.id === quest.dependsOnQuestId)
                            return parent ? !parent.isCompleted : false
                          })()

                          const parentQuestTitle = quest.dependsOnQuestId !== undefined ? (() => {
                            const parent = quests.find((pq) => pq.id === quest.dependsOnQuestId)
                            return parent?.title
                          })() : undefined

                          return (
                            <motion.div
                              key={quest.id}
                              layout
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                            >
                              <QuestCard
                                quest={quest}
                                onComplete={handleCompleteQuest}
                                onFail={handleFailQuest}
                                isNarrating={narratingId === quest.id}
                                narratedMythEvent={narratedEvents[quest.id]}
                                onGenerateRoadmap={handleGenerateRoadmap}
                                isGeneratingRoadmap={generatingRoadmapId === quest.id}
                                onToggleTask={handleToggleTask}
                                isLocked={isLocked}
                                parentQuestTitle={parentQuestTitle}
                              />
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </div>
              ) : (
                <LoreCodex chapters={chapters} />
              )}
            </div>
          </div>

          {/* Sidebar — unchanged */}
          <div className="space-y-6">
            <WorldArchitect
              activeWorld={activeWorld}
              onChangeWorld={handleChangeWorld}
              onForgeCustomWorld={handleForgeCustomWorld}
            />
            <KingdomStatus />
            <LoreFeed lore={lore} />
          </div>

        </div>
      </div>
    </main>
  )
}