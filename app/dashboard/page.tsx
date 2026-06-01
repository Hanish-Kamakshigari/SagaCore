'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowLeft, Send, Sparkle, Award, Compass, BookOpen, Scroll as ScrollIcon, Loader2, Volume2, VolumeX, LogOut } from 'lucide-react'

import KingdomStatus from '../components/KingdomStatus'
import LoreFeed from '../components/LoreFeed'
import QuestCard from '../components/QuestCard'
import XPBar from '../components/XPbar'
import WorldArchitect from '../components/WorldArchitect'
import LoreCodex from '../components/LoreCodex'

import { useAmbientAudio } from '../hooks/useAmbientAudio'
import { useAuth } from '../context/AuthContext'

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
  fetchQuestsFromMongo,
  fetchChaptersFromMongo,
  fetchPlayerStateFromMongo,
} from '@/app/lib/ai'

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()

  const [activeWorld, _setActiveWorld] = useState<World>(worldTemplates.fantasy)
  const [quests, _setQuests]           = useState<Quest[]>([])
  const [xp, _setXp]                   = useState<number>(0)
  const [level, _setLevel]             = useState<number>(1)
  const [lore, _setLore]               = useState<string[]>([
    'The Ancient Library expands once more under your focus.',
    'The Valley of Distraction has weakened due to your high productivity.',
    'The Fortress of Algorithms has risen, establishing order in the digital realms.',
  ])
  const [chapters, _setChapters]       = useState<LoreChapter[]>([])
  const [isWritingChapter, setIsWritingChapter] = useState<boolean>(false)
  const [audioActive, _setAudioActive] = useState<boolean>(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  // Scoped setters to write directly to Namespaced local storage
  const setActiveWorld = (newWorld: World) => {
    _setActiveWorld(newWorld)
    if (user) localStorage.setItem(`sagacore_${user.uid}_activeWorld`, JSON.stringify(newWorld))
  }

  const setQuests = (value: Quest[] | ((prev: Quest[]) => Quest[])) => {
    _setQuests((prev) => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value
      if (user) localStorage.setItem(`sagacore_${user.uid}_quests`, JSON.stringify(next))
      return next
    })
  }

  const setXp = (value: number | ((prev: number) => number)) => {
    _setXp((prev) => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value
      if (user) localStorage.setItem(`sagacore_${user.uid}_xp`, JSON.stringify(next))
      return next
    })
  }

  const setLevel = (value: number | ((prev: number) => number)) => {
    _setLevel((prev) => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value
      if (user) localStorage.setItem(`sagacore_${user.uid}_level`, JSON.stringify(next))
      return next
    })
  }

  const setLore = (value: string[] | ((prev: string[]) => string[])) => {
    _setLore((prev) => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value
      if (user) localStorage.setItem(`sagacore_${user.uid}_lore`, JSON.stringify(next))
      return next
    })
  }

  const setChapters = (value: LoreChapter[] | ((prev: LoreChapter[]) => LoreChapter[])) => {
    _setChapters((prev) => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value
      if (user) localStorage.setItem(`sagacore_${user.uid}_chapters`, JSON.stringify(next))
      return next
    })
  }

  const setAudioActive = (value: boolean | ((prev: boolean) => boolean)) => {
    _setAudioActive((prev) => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value
      if (user) localStorage.setItem(`sagacore_${user.uid}_audioActive`, JSON.stringify(next))
      return next
    })
  }

  // Load Namespaced local storage cache + Sync with MongoDB
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/auth')
      return
    }

    const loadUserData = async () => {
      try {
        const uid = user.uid

        // 1. Instantly Hydrate from Namespaced Cache
        const localActiveWorld = localStorage.getItem(`sagacore_${uid}_activeWorld`)
        const localQuests = localStorage.getItem(`sagacore_${uid}_quests`)
        const localXp = localStorage.getItem(`sagacore_${uid}_xp`)
        const localLevel = localStorage.getItem(`sagacore_${uid}_level`)
        const localChapters = localStorage.getItem(`sagacore_${uid}_chapters`)
        const localLore = localStorage.getItem(`sagacore_${uid}_lore`)
        const localAudio = localStorage.getItem(`sagacore_${uid}_audioActive`)

        if (localActiveWorld) _setActiveWorld(JSON.parse(localActiveWorld))
        if (localQuests) _setQuests(JSON.parse(localQuests))
        else _setQuests(initialQuests)

        if (localXp) _setXp(JSON.parse(localXp))
        if (localLevel) _setLevel(JSON.parse(localLevel))
        if (localChapters) _setChapters(JSON.parse(localChapters))
        if (localLore) _setLore(JSON.parse(localLore))
        if (localAudio) _setAudioActive(JSON.parse(localAudio))

        // 2. Fetch fresh database state in background to sync
        const [dbQuests, dbChapters, dbPlayer] = await Promise.all([
          fetchQuestsFromMongo(uid),
          fetchChaptersFromMongo(uid),
          fetchPlayerStateFromMongo(uid)
        ])

        if (dbQuests && dbQuests.length > 0) {
          _setQuests(dbQuests)
          localStorage.setItem(`sagacore_${uid}_quests`, JSON.stringify(dbQuests))
        } else {
          // New user seed: Save default quests to Mongo
          await Promise.all(initialQuests.map(q => saveQuestToMongo(q, uid)))
          _setQuests(initialQuests)
          localStorage.setItem(`sagacore_${uid}_quests`, JSON.stringify(initialQuests))
        }

        if (dbChapters && dbChapters.length > 0) {
          _setChapters(dbChapters)
          localStorage.setItem(`sagacore_${uid}_chapters`, JSON.stringify(dbChapters))
        }

        if (dbPlayer) {
          _setXp(dbPlayer.xp)
          _setLevel(dbPlayer.level)
          const matchedWorld = Object.values(worldTemplates).find(w => w.theme === dbPlayer.worldTheme) || worldTemplates.fantasy
          _setActiveWorld(matchedWorld)
          localStorage.setItem(`sagacore_${uid}_xp`, JSON.stringify(dbPlayer.xp))
          localStorage.setItem(`sagacore_${uid}_level`, JSON.stringify(dbPlayer.level))
          localStorage.setItem(`sagacore_${uid}_activeWorld`, JSON.stringify(matchedWorld))
        }
      } catch (err) {
        console.error('Failed to sync SAGACORE user data:', err)
      } finally {
        setIsDataLoaded(true)
      }
    }

    loadUserData()
  }, [user, authLoading, router])

  // Trigger procedural atmospheric soundscapes
  useAmbientAudio(activeWorld.theme, audioActive)
  const [newGoal, setNewGoal]               = useState('')
  const [filter, setFilter]                 = useState<'all' | 'wisdom' | 'discipline' | 'creation'>('all')
  const [showLevelUp, setShowLevelUp]       = useState(false)
  const [justLeveledTo, setJustLeveledTo]   = useState(1)
  const [activeTab, setActiveTab]           = useState<'quests' | 'codex'>('quests')

  // Dynamic ranking lookup helper for SAGACORE leveling milestones
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

  // Dynamic rotating placeholders for SAGACORE Dream Forge
  const forgePlaceholders = [
    "study binary search tree traversal algorithms",
    "clear a 5-kilometer running routine at sunrise",
    "build a custom Firebase user context provider",
    "design vector database index search schemas",
    "practice 20 minutes of deep focus meditation",
    "isolate and fix local memory heap leaks",
    "weld solid brass rods for clockwork furnace cores"
  ]
  const [currentPlaceholderIdx, setCurrentPlaceholderIdx] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPlaceholderIdx((prev) => (prev + 1) % forgePlaceholders.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [forgePlaceholders.length])

  // ── Loading states for the three AI engines ──────────────────────────────
  const [isForging, setIsForging]       = useState(false)   // Dream Engine
  const [narratingId, setNarratingId]   = useState<number | null>(null) // Adaptive AI Engine
  const [generatingRoadmapId, setGeneratingRoadmapId] = useState<number | null>(null) // Roadmap generation tracker
  const [narratedEvents, setNarratedEvents] = useState<Record<number, string>>({}) // per-quest narrated myth

  const goalInputRef = useRef<HTMLInputElement>(null)

  // ── Theme colours (updated with responsive hoverGlow effects) ──────────────
  const themeColors = {
    fantasy: {
      radialGlow: 'bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.06),transparent_60%)]',
      borderGlow: 'border-purple-500/20',
      hoverGlow: 'hover:border-purple-500/40 hover:shadow-[0_0_25px_rgba(168,85,247,0.08)]',
      activeText: 'text-purple-300',
      accentBg: 'bg-purple-500/10 border-purple-500/20 text-purple-200',
      btnBg: 'from-purple-500 to-indigo-500'
    },
    cyberpunk: {
      radialGlow: 'bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.06),transparent_60%)]',
      borderGlow: 'border-cyan-500/20',
      hoverGlow: 'hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(6,182,212,0.08)]',
      activeText: 'text-cyan-400',
      accentBg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300',
      btnBg: 'from-cyan-500 to-blue-500'
    },
    steampunk: {
      radialGlow: 'bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.06),transparent_60%)]',
      borderGlow: 'border-orange-500/20',
      hoverGlow: 'hover:border-orange-500/40 hover:shadow-[0_0_25px_rgba(249,115,22,0.08)]',
      activeText: 'text-orange-400',
      accentBg: 'bg-orange-500/10 border-orange-500/20 text-orange-350',
      btnBg: 'from-orange-500 to-amber-500'
    },
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
      const generatedCampaign = await forgeQuestlineWithAI(newGoal, startId, activeWorld.theme, level, user?.uid)

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
      if (user) {
        await Promise.allSettled(generatedCampaign.map((q) => saveQuestToMongo(q, user.uid))).catch(() => {
          console.warn('MongoDB campaign save failed')
        })
      }
    } catch (err) {
      console.warn('Dream Engine AI failed, triggering local fallback:', err)
      
      const { forgeQuestFromGoal } = await import('../lib/data')
      const newId = quests.length + 1
      const fallbackQuest = forgeQuestFromGoal(newGoal, newId, level)
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

    // XP + level progression (improved logic to handle multiple level ups)
    const questXp    = questToComplete.xp
    const newXpTotal = xp + questXp
    let nextLevel    = level
    let remainingXp  = newXpTotal

    let levelUpOccurred = false
    while (remainingXp >= 1000) {
      nextLevel  += 1
      remainingXp = remainingXp - 1000
      levelUpOccurred = true
    }

    setXp(remainingXp)
    setLevel(nextLevel)

    if (levelUpOccurred) {
      setJustLeveledTo(nextLevel)
      setShowLevelUp(true)
      setTimeout(() => setShowLevelUp(false), 5000)
      setLore((prev) => [`✨ CELESTIAL ASCENSION: You have reached Level ${nextLevel}!`, ...prev])
    }

    // Mark quest complete immediately and unblock UI for 0ms optimistic response
    setQuests((prev) => prev.map((q) => (q.id === id ? { ...q, isCompleted: true } : q)))
    setNarratingId(null)

    // Fire the heavy Gemini AI Narrator and MongoDB saving as a non-blocking background worker thread
    const targetUid = user?.uid;
    const targetTheme = activeWorld.theme;
    const currentChaptersCount = chapters.length;

    (async () => {
      setIsWritingChapter(true)
      try {
        // ── Adaptive AI Engine: generate world-change narration ────────────────
        const newChapterId = currentChaptersCount + 1
        const chapter = await generateAdaptiveChapter(
          questToComplete.title,
          questToComplete.category,
          targetTheme,
          newChapterId,
          questToComplete.mythEvent ?? '',
          targetUid
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
        if (targetUid) {
          await Promise.allSettled([
            saveChapterToMongo(chapter, targetUid),
            savePlayerStateToMongo(targetUid, remainingXp, nextLevel, targetTheme),
            saveQuestToMongo({ ...questToComplete, isCompleted: true }, targetUid),
          ]).catch((e) => console.warn('Background MongoDB persist failed:', e))
        }
      } catch (err) {
        console.error('Adaptive Engine failed, using fallback:', err)
        const { generateLoreChapter } = await import('../lib/data')
        const fallbackChapter = generateLoreChapter(
          questToComplete.title,
          questToComplete.category,
          targetTheme,
          currentChaptersCount + 1
        )
        setChapters((prev) => [...prev, fallbackChapter])
        setLore((prev) => [
          `⚔️ Quest complete: "${questToComplete.title}" (+${questXp} XP)`,
          ...prev,
        ])
      } finally {
        setIsWritingChapter(false)
      }
    })()
  }

  // ── Quest failure — dark world narration ──────────────────────────────────
  const handleFailQuest = async (id: number) => {
    if (narratingId !== null) return
    const quest = quests.find((q) => q.id === id)
    if (!quest || quest.isCompleted) return

    setNarratingId(id)
    
    // Mark failed instantly and unblock UI for 0ms optimistic response
    setQuests((prev) => prev.map((q) => (q.id === id ? { ...q, isCompleted: true, failed: true } : q)))
    setNarratingId(null)

    const targetUid = user?.uid;
    const targetTheme = activeWorld.theme;
    const currentChaptersCount = chapters.length;

    (async () => {
      setIsWritingChapter(true)
      try {
        const newChapterId = currentChaptersCount + 1
        const chapter = await generateAdaptiveChapter(
          quest.title,
          quest.category,
          targetTheme,
          newChapterId,
          `FAILED: ${quest.mythEvent ?? 'The realm grows darker.'}`,
          targetUid
        )

        setChapters((prev) => [...prev, chapter])
        setNarratedEvents((prev) => ({ ...prev, [id]: chapter.text }))
        setLore((prev) => [
          `🌑 Darkness spreads: "${quest.title}" was abandoned.`,
          `Shadow Chapter ${newChapterId} etched into the Codex.`,
          ...prev,
        ])

        if (targetUid) {
          await Promise.allSettled([
            saveChapterToMongo(chapter, targetUid),
            saveQuestToMongo({ ...quest, isCompleted: true }, targetUid),
          ]).catch((e) => console.warn('Background MongoDB fail-persist failed:', e))
        }
      } catch (err) {
        console.error('Shadow chronicler failed:', err)
        setLore((prev) => [`🌑 Quest abandoned: "${quest.title}" — the realm suffers.`, ...prev])
      } finally {
        setIsWritingChapter(false)
      }
    })()
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
      if (user) {
        await saveQuestToMongo(updatedQuest, user.uid).catch(() => {
          console.warn('MongoDB quest roadmap save failed')
        })
      }
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

    if (updatedQuest && user) {
      try {
        await saveQuestToMongo(updatedQuest, user.uid)
      } catch (err) {
        console.error('Failed saving task progress:', err)
      }
    }
  }

  const filteredQuests = quests.filter((q) => filter === 'all' || q.category === filter)

  if (authLoading || (user && !isDataLoaded)) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40 pointer-events-none" />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/10 blur-[100px] -z-10 pointer-events-none" />
        <div className="flex flex-col items-center text-center">
          <Loader2 size={40} className="animate-spin text-purple-400 mb-6" />
          <h2 className="text-xl font-bold font-cinzel tracking-[0.2em] text-zinc-200">ALIGNING REALM CORES</h2>
          <p className="text-xs text-zinc-500 mt-2 font-mono uppercase tracking-widest">Synthesizing personalized grid sub-routines...</p>
        </div>
      </main>
    )
  }

  if (!user) {
    return null
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render — identical structure to your original, with two additions:
  //   1. Forge button shows a spinner + disabled state while isForging
  //   2. QuestCard receives onFail, isNarrating, narratedMythEvent props
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <main className="relative min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black px-6 py-8 text-white transition-colors duration-500 overflow-hidden">
      {/* Dynamic backdrop grid */}
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] opacity-60" />
      
      {/* Shifting dual-gradient ambient mesh glows */}
      <div className="absolute inset-0 -z-30 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 40, -25, 0],
            y: [0, -35, 20, 0],
            scale: [1, 1.15, 0.9, 1]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className={`absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full blur-[130px] transition-colors duration-700 ${
            activeWorld.theme === 'fantasy' ? 'bg-purple-600/12' : activeWorld.theme === 'cyberpunk' ? 'bg-cyan-600/12' : 'bg-orange-600/12'
          }`}
        />
        <motion.div
          animate={{
            x: [0, -40, 25, 0],
            y: [0, 35, -20, 0],
            scale: [1, 0.9, 1.15, 1]
          }}
          transition={{
            duration: 24,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className={`absolute -right-20 -bottom-20 h-[500px] w-[500px] rounded-full blur-[130px] transition-colors duration-700 ${
            activeWorld.theme === 'fantasy' ? 'bg-indigo-600/12' : activeWorld.theme === 'cyberpunk' ? 'bg-blue-600/12' : 'bg-amber-600/12'
          }`}
        />
      </div>

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
                <div className="mt-6 w-full rounded-2xl bg-yellow-500/10 border border-yellow-500/20 px-6 py-4 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
                  <span className="block text-zinc-400 font-mono text-[10px] uppercase tracking-widest">New Rank Obtained</span>
                  <span className="block mt-1 font-cinzel text-xl font-black text-yellow-300 tracking-wide uppercase">
                    {getRankName(justLeveledTo)}
                  </span>
                  <span className="block mt-1 text-zinc-500 text-[10px] font-mono font-bold">LEVEL {justLeveledTo} ASCENSION</span>
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

            <div className="hidden text-right sm:block">
              <p className="text-xs text-zinc-500">World Engine</p>
              <p className="text-sm font-mono font-semibold text-zinc-300">Architect 0x7c9</p>
            </div>
            <div className="h-10 w-[1px] bg-zinc-800 hidden sm:block" />
            <span className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-md border transition-colors duration-500 ${colors.accentBg}`}>
              {activeWorld.theme} grid active
            </span>
            <div className="h-10 w-[1px] bg-zinc-800 hidden sm:block" />
            
            {/* Sign Out Button */}
            <button
              onClick={async () => {
                await logout()
                router.push('/auth')
              }}
              title="Sign Out of Portal"
              className="flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-red-400 backdrop-blur-md transition-all duration-300 hover:bg-red-500/12 hover:scale-[1.03] active:scale-[0.97] hover:cursor-pointer"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* XP Bar */}
        <XPBar xp={xp} level={level} theme={activeWorld.theme} />

        {/* Layout grid */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">

          {/* Main column */}
          <div className="space-y-6 lg:col-span-2">

            {/* Dream Forge — only change: button shows spinner when isForging */}
            <div className={`relative overflow-hidden rounded-3xl border ${colors.borderGlow} ${colors.hoverGlow} bg-gradient-to-r from-zinc-900/40 via-zinc-900/20 to-zinc-950/40 p-6 shadow-xl backdrop-blur-xl transition-all duration-500`}>
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
                  placeholder={`e.g., ${forgePlaceholders[currentPlaceholderIdx]}`}
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

              {/* Sample Ambition suggestion chips */}
              <div className="mt-3.5 flex flex-wrap items-center gap-2 select-none">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mr-1 font-mono">Quick Ambitions:</span>
                {[
                  { text: 'Master Graph Traversal Algorithms', theme: 'wisdom' },
                  { text: 'Complete a 5K Sunrise Run', theme: 'discipline' },
                  { text: 'Build generative layout boards with Gemini', theme: 'creation' },
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNewGoal(chip.text)}
                    className="text-[11px] font-semibold border border-zinc-850 bg-zinc-900/30 hover:border-purple-500/35 hover:bg-purple-500/10 hover:text-purple-300 rounded-full px-3.5 py-1.5 transition-all duration-300 hover:scale-[1.03] hover:cursor-pointer active:scale-[0.97]"
                  >
                    {chip.text}
                  </button>
                ))}
              </div>

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
                <LoreCodex chapters={chapters} theme={activeWorld.theme} isWriting={isWritingChapter} />
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
            <KingdomStatus quests={quests} activeWorld={activeWorld} />
            <LoreFeed lore={lore} theme={activeWorld.theme} />
          </div>

        </div>
      </div>
    </main>
  )
}