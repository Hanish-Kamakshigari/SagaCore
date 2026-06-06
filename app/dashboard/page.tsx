'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowLeft, Send, Sparkle, Award, Compass, BookOpen, Scroll as ScrollIcon, Loader2, Volume2, VolumeX, LogOut, Trophy, AlertCircle, RefreshCw, Check, ChevronDown, Flame, Zap, Calendar, TrendingUp, Clock, ShieldAlert } from 'lucide-react'

import KingdomStatus from '../components/KingdomStatus'
import LoreFeed from '../components/LoreFeed'
import QuestCard from '../components/QuestCard'
import XPBar from '../components/XPbar'
import WorldArchitect from '../components/WorldArchitect'
import LoreCodex from '../components/LoreCodex'
import Leaderboard from '../components/Leaderboard'

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
  forgeDailyChallengeWithAI,
} from '@/app/lib/ai'

const playLevelUpFanfare = (theme: 'fantasy' | 'cyberpunk' | 'steampunk') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    
    const type = theme === 'cyberpunk' ? 'sawtooth' : theme === 'steampunk' ? 'triangle' : 'sine'
    const frequencies = [261.63, 329.63, 392.00, 523.25] // C4, E4, G4, C5 major arpeggio
    const baseTime = ctx.currentTime
    
    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.type = type
      osc.frequency.value = freq
      
      const start = baseTime + index * 0.15
      const duration = 0.6
      
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.12, start + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.start(start)
      osc.stop(start + duration)
    })
  } catch (err) {
    console.warn('Audio level up playback failed:', err)
  }
}

const playDailyTriumphChime = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const baseTime = ctx.currentTime
    
    // Play a delightful, sparkling major pentatonic arpeggio (C5, E5, G5, C6)
    const frequencies = [523.25, 659.25, 783.99, 1046.50]
    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.type = 'sine'
      osc.frequency.value = freq
      
      const start = baseTime + index * 0.08
      const duration = 0.4
      
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.08, start + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.start(start)
      osc.stop(start + duration)
    })
  } catch (err) {
    console.warn('Audio chime failed:', err)
  }
}

const getChallengeRarity = (title: string): 'common' | 'rare' | 'epic' | 'legendary' => {
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % 100
  if (index < 50) return 'common'       // 50%
  if (index < 80) return 'rare'         // 30%
  if (index < 95) return 'epic'         // 15%
  return 'legendary'                    // 5%
}

const getStreakMultiplier = (streakCount: number): number => {
  if (streakCount >= 14) return 1.5
  if (streakCount >= 7) return 1.25
  if (streakCount >= 3) return 1.1
  return 1.0
}

function LevelUpConfetti() {
  const particles = Array.from({ length: 80 })
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
      {particles.map((_, i) => {
        const x = Math.random() * 100 // initial x%
        const delay = Math.random() * 1.5 // random animation delay
        const duration = 2.0 + Math.random() * 2 // duration of fall
        const size = 6 + Math.random() * 8 // size in px
        const colors = [
          'bg-yellow-400', 'bg-amber-500', 'bg-orange-500', 'bg-purple-500',
          'bg-pink-500', 'bg-cyan-400', 'bg-teal-400', 'bg-rose-500'
        ]
        const color = colors[Math.floor(Math.random() * colors.length)]
        
        return (
          <motion.div
            key={i}
            initial={{ 
              y: -20, 
              x: `${x}vw`, 
              scale: 0.5, 
              rotate: 0, 
              opacity: 1 
            }}
            animate={{ 
              y: '110vh', 
              x: `${x + (Math.random() * 20 - 10)}vw`, 
              scale: [0.5, 1, 0.8], 
              rotate: 360 + Math.random() * 720, 
              opacity: [1, 1, 0] 
            }}
            transition={{ 
              duration: duration, 
              delay: delay, 
              ease: "easeOut" 
            }}
            className={`absolute rounded-sm ${color}`}
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

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()

  const wasGuestRef = useRef(false)

  useEffect(() => {
    if (user?.uid?.startsWith('guest_')) {
      wasGuestRef.current = true
    }
  }, [user])

  const [activeWorld, _setActiveWorld] = useState<World>(worldTemplates.fantasy)
  const [quests, _setQuests]           = useState<Quest[]>([])
  const [xp, _setXp]                   = useState<number>(0)
  const [level, _setLevel]             = useState<number>(1)
  const [stability, _setStability]     = useState<number>(100)
  const [streak, _setStreak]           = useState<number>(0)
  const [lastDailyChallengeDate, _setLastDailyChallengeDate] = useState<string>('')
  const [lastActiveDate, _setLastActiveDate] = useState<string>('')
  const [dailyChallenge, _setDailyChallenge] = useState<Quest | null>(null)
  const [isForgingDaily, setIsForgingDaily] = useState<boolean>(false)
  const [isReviving, setIsReviving]     = useState<boolean>(false)
  const [forgeCategory, setForgeCategory] = useState<'auto' | 'wisdom' | 'discipline' | 'creation'>('auto')
  const [forgeDuration, setForgeDuration] = useState<number>(3)

  const [lore, _setLore]               = useState<string[]>([
    'The Ancient Library expands once more under your focus.',
    'The Valley of Distraction has weakened due to your high productivity.',
    'The Fortress of Algorithms has risen, establishing order in the digital realms.',
  ])
  const [chapters, _setChapters]       = useState<LoreChapter[]>([])

  const [isWritingChapter, setIsWritingChapter] = useState<boolean>(false)
  const [audioActive, _setAudioActive] = useState<boolean>(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [showAccountDetails, setShowAccountDetails] = useState<boolean>(false)
  const [showStreakNotice, setShowStreakNotice] = useState<boolean>(false)
  const [showDailyConfetti, setShowDailyConfetti] = useState<boolean>(false)
  const [displayName, _setDisplayName] = useState<string>('')
  const [isEditingName, setIsEditingName] = useState<boolean>(false)
  const [tempName, setTempName] = useState<string>('')

  const setDisplayName = (value: string | ((prev: string) => string)) => {
    _setDisplayName((prev) => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value
      if (user) localStorage.setItem(`sagacore_${user.uid}_displayName`, next)
      return next
    })
  }

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

  const setStability = (value: number | ((prev: number) => number)) => {
    _setStability((prev) => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value
      if (user) localStorage.setItem(`sagacore_${user.uid}_stability`, JSON.stringify(next))
      return next
    })
  }

  const setStreak = (value: number | ((prev: number) => number)) => {
    _setStreak((prev) => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value
      if (user) localStorage.setItem(`sagacore_${user.uid}_streak`, JSON.stringify(next))
      return next
    })
  }

  const setLastDailyChallengeDate = (value: string | ((prev: string) => string)) => {
    _setLastDailyChallengeDate((prev) => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value
      if (user) localStorage.setItem(`sagacore_${user.uid}_lastDailyChallengeDate`, next)
      return next
    })
  }

  const setLastActiveDate = (value: string | ((prev: string) => string)) => {
    _setLastActiveDate((prev) => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value
      if (user) localStorage.setItem(`sagacore_${user.uid}_lastActiveDate`, next)
      return next
    })
  }

  const setDailyChallenge = (value: Quest | null | ((prev: Quest | null) => Quest | null)) => {
    _setDailyChallenge((prev) => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value
      if (user) {
        if (next) localStorage.setItem(`sagacore_${user.uid}_dailyChallenge`, JSON.stringify(next))
        else localStorage.removeItem(`sagacore_${user.uid}_dailyChallenge`)
      }
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
      if (wasGuestRef.current) {
        router.push('/')
      } else {
        router.push('/auth')
      }
      return
    }

    const loadUserData = async () => {
      try {
        const uid = user.uid
        const isGuest = uid.startsWith('guest_')

        // 1. Instantly Hydrate from Namespaced Cache
        const localActiveWorld = localStorage.getItem(`sagacore_${uid}_activeWorld`)
        const localQuests = localStorage.getItem(`sagacore_${uid}_quests`)
        const localXp = localStorage.getItem(`sagacore_${uid}_xp`)
        const localLevel = localStorage.getItem(`sagacore_${uid}_level`)
        const localChapters = localStorage.getItem(`sagacore_${uid}_chapters`)
        const localLore = localStorage.getItem(`sagacore_${uid}_lore`)
        const localAudio = localStorage.getItem(`sagacore_${uid}_audioActive`)
        const localStability = localStorage.getItem(`sagacore_${uid}_stability`)
        const localStreak = localStorage.getItem(`sagacore_${uid}_streak`)
        const localLastDailyChallengeDate = localStorage.getItem(`sagacore_${uid}_lastDailyChallengeDate`)
        const localLastActiveDate = localStorage.getItem(`sagacore_${uid}_lastActiveDate`)
        const localDailyChallenge = localStorage.getItem(`sagacore_${uid}_dailyChallenge`)
        const localDisplayName = localStorage.getItem(`sagacore_${uid}_displayName`)

        if (localActiveWorld) _setActiveWorld(JSON.parse(localActiveWorld))
        if (localQuests) _setQuests(JSON.parse(localQuests))
        else _setQuests(initialQuests)

        if (localXp) _setXp(JSON.parse(localXp))
        if (localLevel) _setLevel(JSON.parse(localLevel))
        if (localChapters) _setChapters(JSON.parse(localChapters))
        if (localLore) _setLore(JSON.parse(localLore))
        if (localAudio) _setAudioActive(JSON.parse(localAudio))
        if (localStability) _setStability(JSON.parse(localStability))
        else _setStability(100)
        if (localStreak) _setStreak(JSON.parse(localStreak))
        else _setStreak(0)
        if (localLastDailyChallengeDate) _setLastDailyChallengeDate(localLastDailyChallengeDate)
        if (localLastActiveDate) _setLastActiveDate(localLastActiveDate)
        if (localDailyChallenge) _setDailyChallenge(JSON.parse(localDailyChallenge))
        if (localDisplayName) _setDisplayName(localDisplayName)

        // If it's a guest session, save initial/pre-filled quests to local storage if not already there
        if (isGuest) {
          if (!localQuests) {
            localStorage.setItem(`sagacore_${uid}_quests`, JSON.stringify(initialQuests))
          }
          setIsDataLoaded(true)
          return
        }

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
          _setStability(dbPlayer.stability !== undefined ? dbPlayer.stability : 100)
          _setStreak(dbPlayer.streak !== undefined ? dbPlayer.streak : 0)
          _setLastDailyChallengeDate(dbPlayer.lastDailyChallengeDate || '')
          _setLastActiveDate(dbPlayer.lastActiveDate || '')
          if (dbPlayer.displayName) {
            _setDisplayName(dbPlayer.displayName)
            localStorage.setItem(`sagacore_${uid}_displayName`, dbPlayer.displayName)
          }

          const matchedWorld = Object.values(worldTemplates).find(w => w.theme === dbPlayer.worldTheme) || worldTemplates.fantasy
          _setActiveWorld(matchedWorld)
          localStorage.setItem(`sagacore_${uid}_xp`, JSON.stringify(dbPlayer.xp))
          localStorage.setItem(`sagacore_${uid}_level`, JSON.stringify(dbPlayer.level))
          localStorage.setItem(`sagacore_${uid}_activeWorld`, JSON.stringify(matchedWorld))
          localStorage.setItem(`sagacore_${uid}_stability`, JSON.stringify(dbPlayer.stability !== undefined ? dbPlayer.stability : 100))
          localStorage.setItem(`sagacore_${uid}_streak`, JSON.stringify(dbPlayer.streak !== undefined ? dbPlayer.streak : 0))
          if (dbPlayer.lastDailyChallengeDate) localStorage.setItem(`sagacore_${uid}_lastDailyChallengeDate`, dbPlayer.lastDailyChallengeDate)
          if (dbPlayer.lastActiveDate) localStorage.setItem(`sagacore_${uid}_lastActiveDate`, dbPlayer.lastActiveDate)

          // Sync email with MongoDB
          if (user.email && dbPlayer.email !== user.email) {
            await savePlayerStateToMongo(
              uid, 
              dbPlayer.xp, 
              dbPlayer.level, 
              dbPlayer.worldTheme, 
              user.email,
              dbPlayer.stability !== undefined ? dbPlayer.stability : 100,
              dbPlayer.streak !== undefined ? dbPlayer.streak : 0,
              dbPlayer.lastDailyChallengeDate || undefined,
              dbPlayer.lastActiveDate || undefined,
              dbPlayer.displayName || localDisplayName || undefined
            )
          }
        } else {
          // If no player state in DB, initialize it with email!
          const initialXp = localXp ? JSON.parse(localXp) : 0
          const initialLevel = localLevel ? JSON.parse(localLevel) : 1
          const initialTheme = localActiveWorld ? JSON.parse(localActiveWorld).theme : 'fantasy'
          const initialStability = localStability ? JSON.parse(localStability) : 100
          const initialStreak = localStreak ? JSON.parse(localStreak) : 0
          await savePlayerStateToMongo(
            uid, 
            initialXp, 
            initialLevel, 
            initialTheme, 
            user.email, 
            initialStability, 
            initialStreak, 
            localLastDailyChallengeDate || undefined, 
            localLastActiveDate || undefined,
            localDisplayName || undefined
          )
        }
      } catch (err) {
        console.error('Failed to sync SAGACORE user data:', err)
      } finally {
        setIsDataLoaded(true)
      }
    }

    loadUserData()
  }, [user, authLoading, router])

  // Ref to guarantee daily login check runs exactly once per session hydration
  const checkedDailyRef = useRef(false)

  // Generate today's Daily Challenge Quest
  const generateDailyChallenge = async (todayStr: string, theme: 'fantasy' | 'cyberpunk' | 'steampunk') => {
    if (isForgingDaily) return
    setIsForgingDaily(true)
    try {
      const challenge = await forgeDailyChallengeWithAI(theme, user?.uid)
      setDailyChallenge(challenge)
      setLore((prev) => [
        `✨ Today's Daily Trial has been forged: "${challenge.title}"`,
        ...prev
      ])
    } catch (err) {
      console.error('Failed generating daily challenge:', err)
    } finally {
      setIsForgingDaily(false)
    }
  }

  // Daily Check-In effect (Streak, decay, daily challenge)
  useEffect(() => {
    if (!isDataLoaded || !user || checkedDailyRef.current) return
    checkedDailyRef.current = true

    const checkDailyLogin = async () => {
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      const uid = user.uid
      const isGuest = uid.startsWith('guest_')

      if (!lastActiveDate) {
        setLastActiveDate(todayStr)
        await generateDailyChallenge(todayStr, activeWorld.theme)
        setShowStreakNotice(true)
        return
      }

      if (lastActiveDate === todayStr) {
        if (!dailyChallenge && lastDailyChallengeDate !== todayStr) {
          await generateDailyChallenge(todayStr, activeWorld.theme)
        }
        return
      }

      // Calculate elapsed days
      const lastActive = new Date(lastActiveDate)
      const current = new Date(todayStr)
      const diffTime = Math.abs(current.getTime() - lastActive.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays >= 1) {
        let nextStreak = streak
        if (diffDays > 1) {
          nextStreak = 0
          setStreak(0)
          setLore((prev) => [`🔥 Streak lost! Complete daily quests to maintain consistency.`, ...prev])
        }

        // Apply Realm Stability decay for incomplete active quests
        const activeIncompleteQuests = quests.filter(q => !q.isCompleted && q.id !== 9999)
        let decayAmount = 0
        let newStability = stability

        if (activeIncompleteQuests.length > 0) {
          decayAmount = 10 * diffDays
          newStability = Math.max(0, stability - decayAmount)
          setStability(newStability)

          if (newStability === 0) {
            setLore((prev) => [
              `⚠️ CRITICAL ALERT: Realm Stability collapsed to 0%!`,
              `A Restoration Trial is required to revive the core.`,
              ...prev
            ])
          } else {
            setLore((prev) => [
              `⚠️ Realm Stability decayed by ${decayAmount}% due to ${activeIncompleteQuests.length} incomplete quests.`,
              ...prev
            ])
          }
        }

        // Update active date
        setLastActiveDate(todayStr)

        // Generate today's daily challenge
        if (lastDailyChallengeDate !== todayStr) {
          await generateDailyChallenge(todayStr, activeWorld.theme)
        }

        // Show streak notice on new day login
        setShowStreakNotice(true)

        // Persist updates to DB
        if (!isGuest) {
          await savePlayerStateToMongo(
            uid,
            xp,
            level,
            activeWorld.theme,
            user.email,
            newStability,
            nextStreak,
            lastDailyChallengeDate || undefined,
            todayStr,
            displayName || undefined
          ).catch((e) => console.warn('Failed saving daily decay check state:', e))
        }
      }
    }

    checkDailyLogin()
  }, [isDataLoaded, user, quests, stability, streak, lastActiveDate, lastDailyChallengeDate, activeWorld.theme, dailyChallenge])

  // ── Automatic Quest Expiration Sweep ───────────────────────────────────────
  const [hasCheckedExpiration, setHasCheckedExpiration] = useState(false)

  useEffect(() => {
    if (!isDataLoaded || !user || hasCheckedExpiration || quests.length === 0) return
    setHasCheckedExpiration(true)

    const sweepExpiredQuests = async () => {
      const now = new Date()
      let updatedCount = 0
      let penalty = 0
      const targetUid = user.uid
      const isGuest = targetUid.startsWith('guest_')
      
      const newQuestsState = await Promise.all(quests.map(async (q) => {
        if (!q.isCompleted && q.deadline) {
          const deadlineDate = new Date(q.deadline)
          if (now > deadlineDate) {
            updatedCount++
            penalty += 15
            
            const failedQuest = {
              ...q,
              isCompleted: true,
              failed: true
            }

            try {
              const chapterId = chapters.length + updatedCount
              const chapter = await generateAdaptiveChapter(
                q.title,
                q.category,
                activeWorld.theme,
                chapterId,
                `FAILED: The deadline passed. ${q.mythEvent || 'The realm grows darker.'}`,
                targetUid
              )
              
              setChapters((prev) => [...prev, chapter])
              setLore((prev) => [
                `🌑 Quest expired: "${q.title}" failed deadline check (-15% Stability).`,
                `Shadow Chapter ${chapterId} etched into the Codex.`,
                ...prev,
              ])
              
              if (!isGuest) {
                await saveChapterToMongo(chapter, targetUid)
              }
            } catch (err) {
              console.warn('Failed to generate adaptive failure chapter:', err)
              setLore((prev) => [
                `🌑 Quest expired: "${q.title}" failed deadline check (-15% Stability).`,
                ...prev,
              ])
            }

            if (!isGuest) {
              await saveQuestToMongo(failedQuest, targetUid).catch(() => {})
            }

            return failedQuest
          }
        }
        return q
      }))

      if (updatedCount > 0) {
        setQuests(newQuestsState)
        const nextStability = Math.max(0, stability - penalty)
        setStability(nextStability)
        
        if (!isGuest) {
          await savePlayerStateToMongo(
            targetUid,
            xp,
            level,
            activeWorld.theme,
            user.email,
            nextStability,
            streak,
            lastDailyChallengeDate || undefined,
            lastActiveDate || undefined,
            displayName || undefined
          ).catch((e) => console.warn('Failed saving expired state stability update:', e))
        }
      }
    }

    sweepExpiredQuests()
  }, [isDataLoaded, user, quests, stability, chapters.length, activeWorld.theme])

  const handleRestorationTrial = async () => {
    if (stability > 0 || isReviving) return
    setIsReviving(true)
    
    // Simulate restoration calibration time
    await new Promise((resolve) => setTimeout(resolve, 2000))
    
    const nextStability = 50
    setStability(nextStability)
    setIsReviving(false)
    
    setLore((prev) => [
      `❇️ REALM RESTORED: Core stabilized back to 50% Stability!`,
      `Distortion fields collapsed. Normal quest activities are unblocked.`,
      ...prev
    ])
    
    if (user && !user.uid.startsWith('guest_')) {
      await savePlayerStateToMongo(user.uid, xp, level, activeWorld.theme, user.email, 50, streak, lastDailyChallengeDate, lastActiveDate, displayName || undefined)
        .catch((e) => console.warn('Failed to save restoration state:', e))
    }
  }

  // Trigger procedural atmospheric soundscapes
  useAmbientAudio(activeWorld.theme, audioActive)
  const [newGoal, setNewGoal]               = useState('')
  const [filter, setFilter]                 = useState<'all' | 'wisdom' | 'discipline' | 'creation'>('all')
  const [showLevelUp, setShowLevelUp]       = useState(false)
  const [justLeveledTo, setJustLeveledTo]   = useState(1)
  const [activeTab, setActiveTab]           = useState<'quests' | 'codex' | 'leaderboard'>('quests')

  // Dynamic ranking lookup helper for SAGACORE leveling milestones
  const getRankName = (lvl: number, currentTheme: 'fantasy' | 'cyberpunk' | 'steampunk' = 'fantasy') => {
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

  // Dynamic rotating placeholders for SAGACORE Dream Forge
  const forgePlaceholders = [
    "forge a brand new responsive landing page layout",
    "conquer the dragon of morning cardio exercises",
    "read three chapters of that dusty system design book",
    "slay the compiler bug hidden in the server route",
    "draft an epic lore script for the quest log",
    "configure a local database backup pipeline",
    "refactor a messy legacy React component library",
    "complete 45 minutes of intensive language practice",
    "sketch the primary blueprints for a mechanical core"
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
    setLore((prev) => [`[SHIFT] REALM SHIFT: Now entering: "${nextWorld.name}"`, ...prev])
  }

  const handleSaveDisplayName = async (newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed) return
    setDisplayName(trimmed)
    setIsEditingName(false)
    
    // Add to lore codex logs
    setLore((prev) => [
      `✍️ Scribe handle registered as "${trimmed}"`,
      ...prev
    ])

    // Save state to Mongo
    if (user && !user.uid.startsWith('guest_')) {
      try {
        await savePlayerStateToMongo(
          user.uid,
          xp,
          level,
          activeWorld.theme,
          user.email,
          stability,
          streak,
          lastDailyChallengeDate || undefined,
          lastActiveDate || undefined,
          trimmed
        )
      } catch (err) {
        console.warn('Failed saving updated Scribe Handle:', err)
      }
    }
  }

  // ── Custom world forge — now calls Gemini instead of keyword-matching ──────
  const handleForgeCustomWorld = async (prompt: string) => {
    // Optimistic UI update with prompt as placeholder name
    setLore((prev) => [`[FORGING] World Architect is shaping: "${prompt}"…`, ...prev])

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
        `[FORGED] WORLD FORGE: Reality grids aligned for "${result.name}" — ${result.lore}`,
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
        `[FORGED] WORLD FORGE: Reality grids aligned for custom world: "${fallbackWorld.name}"!`,
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
      let generatedQuests: Quest[] = []

      if (level < 3) {
        // Forge a single quest
        const singleQuest = await forgeQuestWithAI(
          newGoal,
          startId,
          activeWorld.theme,
          user?.uid,
          forgeCategory === 'auto' ? undefined : forgeCategory,
          forgeDuration
        )
        generatedQuests = [singleQuest]
      } else {
        // Forge a campaign (3 quests)
        generatedQuests = await forgeQuestlineWithAI(
          newGoal,
          startId,
          activeWorld.theme,
          level,
          user?.uid,
          forgeDuration
        )
      }

      // Prepend all forged quests to state
      setQuests((prev) => [...generatedQuests, ...prev])
      setNewGoal('')

      if (level < 3) {
        setLore((prev) => [
          `[FORGED] Dream Forge aligned reality for quest: "${generatedQuests[0].title}" (${generatedQuests[0].difficulty} · +${generatedQuests[0].xp} XP)`,
          ...prev,
        ])
      } else {
        setLore((prev) => [
          `[FORGED] Dream Forge aligned reality for a 3-part campaign: "${newGoal}"!`,
          `Quest 1 (Wisdom): "${generatedQuests[0].title}"`,
          `Quest 2 (Creation): "${generatedQuests[1].title}"`,
          `Quest 3 (Discipline): "${generatedQuests[2].title}"`,
          ...prev,
        ])
      }

      // Persist to MongoDB via Memory Engine (Skip for Guest Mode)
      if (user && !user.uid.startsWith('guest_')) {
        await Promise.allSettled(generatedQuests.map((q) => saveQuestToMongo(q, user.uid))).catch(() => {
          console.warn('MongoDB campaign save failed')
        })
      }
    } catch (err) {
      console.warn('Dream Engine AI failed, triggering local fallback:', err)
      
      const { forgeQuestFromGoal } = await import('../lib/data')
      const newId = quests.length + 1
      const fallbackQuest = forgeQuestFromGoal(newGoal, newId, level)
      const now = new Date()
      const deadline = new Date(now.getTime() + forgeDuration * 24 * 60 * 60 * 1000)
      const initializedFallback: Quest = {
        ...fallbackQuest,
        category: level < 3 && forgeCategory !== 'auto' ? forgeCategory : fallbackQuest.category,
        createdAtString: now.toISOString(),
        deadline: deadline.toISOString(),
        completedTasks: fallbackQuest.tasks ? new Array(fallbackQuest.tasks.length).fill(false) : []
      }

      setQuests((prev) => [initializedFallback, ...prev])
      setNewGoal('')

      setLore((prev) => [
        `[FORGED] Dream Forge conjured: "${initializedFallback.title}" (${initializedFallback.difficulty} · +${initializedFallback.xp} XP)`,
        ...prev,
      ])
    } finally {
      setIsForging(false)
    }
  }

  // ── Quest completion — runs Adaptive AI Engine + Memory Engine ─────────────
  const handleCompleteQuest = async (id: number) => {
    if (narratingId !== null || stability === 0) return
    const questToComplete = quests.find((q) => q.id === id)
    if (!questToComplete || questToComplete.isCompleted) return

    setNarratingId(id)

    // XP + level progression (improved logic to handle multiple level ups)
    const questXp    = questToComplete.xp
    const multiplier = getStreakMultiplier(streak)
    const rewardedXp = Math.round(questXp * multiplier)
    const newXpTotal = xp + rewardedXp
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

    // Complete Quest adds +10% stability
    let nextStability = Math.min(100, stability + 10)
    if (levelUpOccurred) {
      nextStability = 100
    }
    setStability(nextStability)

    // Complete Quest updates streak
    let nextStreak = streak
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    if (lastActiveDate !== todayStr) {
      nextStreak = streak === 0 ? 1 : streak + 1
      setStreak(nextStreak)
      setLastActiveDate(todayStr)
    }

    if (levelUpOccurred) {
      setJustLeveledTo(nextLevel)
      setShowLevelUp(true)
      playLevelUpFanfare(activeWorld.theme)
      setTimeout(() => setShowLevelUp(false), 5000)
      setLore((prev) => [`[LEVEL UP] CELESTIAL ASCENSION: You have reached Level ${nextLevel}!`, ...prev])
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

        const categoryTag =
          questToComplete.category === 'wisdom' ? '[WISDOM]' :
          questToComplete.category === 'creation' ? '[CREATION]' : '[DISCIPLINE]'

        setLore((prev) => [
          `${categoryTag} Triumph! "${questToComplete.title}" (+${rewardedXp} XP${multiplier > 1 ? ` [${Math.round((multiplier - 1) * 100)}% Streak Bonus]` : ''}, +10% Stability)`,
          `Scribed Chapter ${newChapterId}: "${chapter.title}"`,
          ...prev,
        ])

        // ── Memory Engine: persist chapter and player state ──────────────────── (Skip for Guest Mode)
        if (targetUid && !targetUid.startsWith('guest_')) {
          await Promise.allSettled([
            saveChapterToMongo(chapter, targetUid),
            savePlayerStateToMongo(targetUid, remainingXp, nextLevel, targetTheme, user?.email, nextStability, nextStreak, lastDailyChallengeDate || undefined, todayStr),
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
          `[COMPLETE] Quest complete: "${questToComplete.title}" (+${rewardedXp} XP${multiplier > 1 ? ` [${Math.round((multiplier - 1) * 100)}% Streak Bonus]` : ''}, +10% Stability)`,
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

    // Fail Quest decays stability by 15%
    const nextStability = Math.max(0, stability - 15)
    setStability(nextStability)
    
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
          `🌑 Darkness spreads: "${quest.title}" was abandoned (-15% Stability).`,
          `Shadow Chapter ${newChapterId} etched into the Codex.`,
          ...prev,
        ])

        if (targetUid && !targetUid.startsWith('guest_')) {
          await Promise.allSettled([
            saveChapterToMongo(chapter, targetUid),
            savePlayerStateToMongo(targetUid, xp, level, targetTheme, user?.email, nextStability, streak, lastDailyChallengeDate || undefined, lastActiveDate || undefined),
            saveQuestToMongo({ ...quest, isCompleted: true, failed: true }, targetUid),
          ]).catch((e) => console.warn('Background MongoDB fail-persist failed:', e))
        }
      } catch (err) {
        console.error('Shadow chronicler failed:', err)
        setLore((prev) => [`🌑 Quest abandoned: "${quest.title}" — the realm suffers (-15% Stability).`, ...prev])
      } finally {
        setIsWritingChapter(false)
      }
    })()
  }

  const handleCompleteDailyChallenge = async () => {
    if (!dailyChallenge || dailyChallenge.isCompleted || narratingId !== null || stability === 0) return

    setNarratingId(9999)

    // Mark completed optimistically
    const completedChallenge = { ...dailyChallenge, isCompleted: true }
    setDailyChallenge(completedChallenge)

    // Dynamic XP + Stability reward based on rarity
    const rarity = getChallengeRarity(dailyChallenge.title)
    const challengeXp = rarity === 'legendary' ? 300 : rarity === 'epic' ? 200 : rarity === 'rare' ? 150 : 100
    const challengeStability = rarity === 'legendary' ? 35 : rarity === 'epic' ? 25 : rarity === 'rare' ? 20 : 15

    // XP + level progression
    const multiplier = getStreakMultiplier(streak)
    const rewardedXp = Math.round(challengeXp * multiplier)
    const newXpTotal = xp + rewardedXp
    let nextLevel = level
    let remainingXp = newXpTotal

    let levelUpOccurred = false
    while (remainingXp >= 1000) {
      nextLevel += 1
      remainingXp = remainingXp - 1000
      levelUpOccurred = true
    }

    setXp(remainingXp)
    setLevel(nextLevel)

    // Daily Challenge completion adds stability
    let nextStability = Math.min(100, stability + challengeStability)
    if (levelUpOccurred) {
      nextStability = 100
    }
    setStability(nextStability)

    // Update streak:
    let nextStreak = streak
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    
    const alreadyDidChallengeToday = lastDailyChallengeDate === todayStr
    if (!alreadyDidChallengeToday) {
      nextStreak = streak + 1
      setStreak(nextStreak)
    }

    setLastDailyChallengeDate(todayStr)
    setNarratingId(null)

    // Trigger daily success effects
    playDailyTriumphChime()
    setShowDailyConfetti(true)
    setTimeout(() => setShowDailyConfetti(false), 4000)

    if (levelUpOccurred) {
      setJustLeveledTo(nextLevel)
      setShowLevelUp(true)
      playLevelUpFanfare(activeWorld.theme)
      setTimeout(() => setShowLevelUp(false), 5000)
      setLore((prev) => [`[LEVEL UP] CELESTIAL ASCENSION: You have reached Level ${nextLevel}!`, ...prev])
    }

    const targetUid = user?.uid
    const targetTheme = activeWorld.theme

    setIsWritingChapter(true)
    try {
      const chapterId = chapters.length + 1
      const chapter = await generateAdaptiveChapter(
        dailyChallenge.title,
        dailyChallenge.category,
        targetTheme,
        chapterId,
        dailyChallenge.mythEvent ?? 'The realm celebrates completing the daily trial.',
        targetUid
      )

      setChapters((prev) => [...prev, chapter])
      setLore((prev) => [
        `🏆 Daily Challenge Triumph! Completed: "${dailyChallenge.title}" (+${rewardedXp} XP${multiplier > 1 ? ` [${Math.round((multiplier - 1) * 100)}% Streak Bonus]` : ''}, +${challengeStability}% Stability)`,
        `🔥 Streak updated: ${nextStreak} Days!`,
        `Scribed Daily Chapter ${chapterId}: "${chapter.title}"`,
        ...prev,
      ])

      // Save player state and chapter to DB (Skip for guest)
      if (targetUid && !targetUid.startsWith('guest_')) {
        await Promise.allSettled([
          saveChapterToMongo(chapter, targetUid),
          savePlayerStateToMongo(targetUid, remainingXp, nextLevel, targetTheme, user?.email, nextStability, nextStreak, todayStr, todayStr)
        ]).catch((e) => console.warn('Background MongoDB daily challenge persist failed:', e))
      }
    } catch (err) {
      console.error('Daily challenge adaptive chapter failed, using fallback:', err)
      const fallbackTitle = `Chapter ${chapters.length + 1}: Triumph of ${dailyChallenge.title}`
      const fallbackText = `The daily alignment ritual was successfully completed. The realm hums with steady power, granting +15% stability.`
      const fallbackChapter = {
        id: chapters.length + 1,
        title: fallbackTitle,
        text: fallbackText,
        timestamp: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      }
      setChapters((prev) => [...prev, fallbackChapter])
      setLore((prev) => [
        `🏆 Completed Daily Challenge: "${dailyChallenge.title}" (+${rewardedXp} XP${multiplier > 1 ? ` [${Math.round((multiplier - 1) * 100)}% Streak Bonus]` : ''}, +${challengeStability}% Stability)`,
        ...prev,
      ])
    } finally {
      setIsWritingChapter(false)
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
        `[ROADMAP] ROADMAP GENERATED: AI has unlocked the sacred roadmap for "${quest.title}"!`,
        ...prev,
      ])

            // Persist to MongoDB via Memory Engine (Skip for Guest Mode)
      if (user && !user.uid.startsWith('guest_')) {
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
        `[ROADMAP] ROADMAP UNLOCKED: Unlocked a legendary manual roadmap for "${quest.title}"!`,
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

      const tasksCount = quest.tasks ? quest.tasks.length : 0
      let baseArray = quest.completedTasks || []
      
      // Ensure array length matches task length exactly
      if (baseArray.length !== tasksCount) {
        baseArray = baseArray.slice(0, tasksCount)
        while (baseArray.length < tasksCount) {
          baseArray.push(false)
        }
      }

      const updatedCompletedTasks = [...baseArray]
      updatedCompletedTasks[taskIndex] = !updatedCompletedTasks[taskIndex]

      return {
        ...quest,
        completedTasks: updatedCompletedTasks,
      }
    })

    setQuests(updatedQuests)

    const updatedQuest = updatedQuests.find(
      (q) => q.id === questId
    )

    if (updatedQuest && user && !user.uid.startsWith('guest_')) {
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
      {showDailyConfetti && <LevelUpConfetti />}
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

      {/* Level Up modal — with Confetti */}
      <AnimatePresence>
        {showLevelUp && (
          <>
            <LevelUpConfetti />
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
                    {getRankName(justLeveledTo, activeWorld.theme)}
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
        </>
      )}
      </AnimatePresence>

      {/* Streak Daily Check-In Notice Modal */}
      <AnimatePresence>
        {showStreakNotice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 backdrop-blur-md overflow-y-auto py-8"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: -30, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 80 }}
              className="relative max-w-2xl w-full overflow-hidden rounded-[2.5rem] border border-amber-500/25 bg-zinc-950 p-6 md:p-8 text-center shadow-[0_0_60px_rgba(245,158,11,0.2)] my-auto"
            >
              {/* Radial gradient background highlights */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08),transparent_70%)] pointer-events-none" />
              
              <div className="relative z-10 flex flex-col items-center">
                {/* Pulsing Flame Icon */}
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/35 bg-amber-500/10 text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)] mb-4 animate-pulse">
                  <Flame size={32} className="animate-bounce text-orange-500 fill-amber-500" />
                </div>

                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 font-mono">Cognitive Connection Established</span>
                <h2 className="text-3xl font-extrabold text-white mt-1.5 font-cinzel tracking-wider">WELCOME BACK, SCRIBE</h2>
                
                <p className="mt-3 text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
                  {streak > 0 ? (
                    <>
                      Your daily check-in is synchronized! Keep your streak burning hot by completing today's focus trial to earn bonus multipliers.
                    </>
                  ) : (
                    <>
                      Ignite a new consistency fire today! Forge your active ambitions to lock in daily progression.
                    </>
                  )}
                </p>

                {/* Big streak showcase banner */}
                <div className="mt-5 w-full rounded-2xl bg-amber-500/10 border border-amber-500/20 py-3.5 px-6 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
                  <span className="block text-zinc-550 font-mono text-[9px] uppercase tracking-wider">Active consistency record</span>
                  <span className="block mt-0.5 font-mono text-3xl font-black text-amber-400 tracking-wider">
                    {streak} DAY STREAK
                  </span>
                  <span className="block mt-0.5 text-[9px] text-zinc-450 uppercase font-mono tracking-widest">
                    {streak > 0 ? "🔥 RETAIN THE COGNITIVE FLOW" : "⚡ IGNITE DAILY PROTOCOLS"}
                  </span>
                </div>

                {/* 3-Step Educational Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 w-full text-left">
                  {/* Step 1 */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex flex-col items-start transition hover:border-amber-500/20">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 mb-3">
                      <Zap size={16} />
                    </div>
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-400">1. Ignite Streak</span>
                    <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                      Complete any Quest or your Daily Focus Trial on an active day. Your streak counter ignites to <strong className="text-zinc-200">1 Day</strong>.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex flex-col items-start transition hover:border-amber-500/20">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 mb-3">
                      <Calendar size={16} />
                    </div>
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-400">2. Keep it Burning</span>
                    <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                      Log in and complete at least one Quest or Focus Trial within each <strong className="text-zinc-200">24-hour cycle</strong> to maintain the fire.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex flex-col items-start transition hover:border-amber-500/20">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 mb-3">
                      <TrendingUp size={16} />
                    </div>
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-400">3. Amplify Rewards</span>
                    <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                      Get powerful XP multipliers for all quest completions:
                    </p>
                    <ul className="text-[10px] text-zinc-500 font-mono mt-1.5 space-y-0.5">
                      <li>• 3+ Days: <strong className="text-amber-400">1.1x XP</strong></li>
                      <li>• 7+ Days: <strong className="text-amber-400">1.25x XP</strong></li>
                      <li>• 14+ Days: <strong className="text-amber-400">1.5x XP</strong></li>
                    </ul>
                  </div>
                </div>

                {/* Consequences Warning callout */}
                <div className="mt-6 w-full rounded-2xl bg-red-950/15 border border-red-500/20 p-4 text-left flex items-start gap-3">
                  <ShieldAlert size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-red-400 block">Consequences of Disconnection</span>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      Missing a day resets your streak to <strong className="text-zinc-200">0</strong>. Additionally, incomplete active quests will decay your <strong className="text-zinc-200">Realm Stability by 10% daily</strong>. At 0%, the cores collapse, freezing quest forging until a Restoration Trial is complete.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowStreakNotice(false)}
                  className="mt-6 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 text-sm font-bold transition hover:brightness-110 active:scale-98 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                >
                  Enter Sanctum
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Realm Collapse Overlay */}
      <AnimatePresence>
        {stability === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4 backdrop-blur-lg"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 20 }}
              className="relative max-w-lg w-full overflow-hidden rounded-[2.5rem] border border-red-500/30 bg-zinc-950 p-10 text-center shadow-[0_0_60px_rgba(239,68,68,0.2)]"
            >
              {/* Pulsing red vector grid */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.08),transparent_70%)] -z-10" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.01)_1px,transparent_1px)] bg-[size:30px_30px] opacity-30 pointer-events-none -z-10" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-red-500/30 bg-red-500/10 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-pulse mb-6">
                  <AlertCircle size={44} className="animate-bounce" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-red-400 font-mono">System Catastrophe</span>
                <h2 className="text-3xl font-black text-white mt-3 font-cinzel tracking-wider">REALM CORES COLLAPSED</h2>
                <p className="mt-4 text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  Your neglected commitments have caused reality synchronization to decay. Time flows are frozen, blocking quest forging and completion.
                </p>
                
                <div className="mt-8 w-full rounded-2xl bg-zinc-900/60 border border-zinc-850 p-6 text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono block mb-1">Restoration Requirement</span>
                  <span className="font-cinzel text-lg font-bold text-zinc-200">The Calibration Ritual</span>
                  <p className="text-xs text-zinc-555 mt-1 leading-normal">
                    Initiate a diagnostics sequence to calibrate the realm oscillators and restore baseline coherence (50% stability).
                  </p>
                </div>
                
                <button
                  onClick={handleRestorationTrial}
                  disabled={isReviving}
                  className="mt-8 w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 text-white py-3.5 font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(239,68,68,0.25)] hover:shadow-[0_0_30px_rgba(239,68,68,0.45)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isReviving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      <span>Calibrating Realm Cores…</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <RefreshCw size={16} />
                      <span>Execute Restoration Trial</span>
                    </span>
                  )}
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
            {user.uid.startsWith('guest_') && (
              <>
                <span className="rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-md border border-amber-500/35 bg-amber-500/10 text-amber-300 animate-pulse select-none">
                  Demo Mode
                </span>
                <div className="h-10 w-[1px] bg-zinc-800 hidden sm:block" />
              </>
            )}
            <span className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-md border transition-colors duration-500 ${colors.accentBg}`}>
              {activeWorld.theme} grid active
            </span>
            <div className="h-10 w-[1px] bg-zinc-800 hidden sm:block" />
            <div 
              className="relative py-2"
              onMouseEnter={() => setShowAccountDetails(true)}
              onMouseLeave={() => {
                if (!isEditingName) setShowAccountDetails(false)
              }}
            >
              <button
                className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/40 p-1.5 text-xs font-medium backdrop-blur-md hover:border-zinc-700 hover:bg-zinc-900/60 transition-all duration-300 select-none cursor-default"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-850 border border-zinc-750 text-xs font-black uppercase text-zinc-300 font-mono">
                  {user.uid.startsWith('guest_') ? 'G' : (user.email?.[0] || 'U')}
                </div>
                <ChevronDown size={14} className="text-zinc-500 mr-0.5" />
              </button>

              {/* Popover Card */}
              <AnimatePresence>
                {showAccountDetails && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 mt-1 w-72 z-40 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl"
                  >
                    <div className="flex items-center gap-3 border-b border-zinc-850/60 pb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/25 text-sm font-black uppercase text-purple-300 font-mono">
                        {user.uid.startsWith('guest_') ? 'G' : (user.email?.[0] || 'U')}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <span className="block text-[9px] font-bold uppercase tracking-widest text-zinc-550 font-mono">Active Scribe</span>
                        {isEditingName ? (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <input
                              type="text"
                              value={tempName}
                              onChange={(e) => setTempName(e.target.value)}
                              placeholder="Choose Handle"
                              maxLength={15}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-purple-500/50"
                            />
                            <button
                              onClick={() => handleSaveDisplayName(tempName)}
                              className="text-green-400 hover:text-green-300 p-0.5"
                              title="Save Handle"
                            >
                              <Check size={13} strokeWidth={3} />
                            </button>
                            <button
                              onClick={() => setIsEditingName(false)}
                              className="text-zinc-500 hover:text-zinc-400 p-0.5"
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-1 group/name">
                            <span className="block text-xs font-semibold text-zinc-200 truncate font-mono" title={displayName || user.email || 'Guest'}>
                              {displayName || (user.uid.startsWith('guest_') ? 'Guest Scribe' : user.email?.split('@')[0])}
                            </span>
                            <button
                              onClick={() => {
                                setTempName(displayName || (user.uid.startsWith('guest_') ? 'Guest Scribe' : user.email?.split('@')[0] || ''))
                                setIsEditingName(true)}
                              }
                              className="text-zinc-550 hover:text-purple-400 opacity-0 group-hover/name:opacity-100 transition-opacity p-0.5 cursor-pointer"
                              title="Edit Scribe Handle"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
                            </button>
                          </div>
                        )}
                        {!user.uid.startsWith('guest_') && !isEditingName && (
                          <span className="block text-[9px] text-zinc-500 truncate font-mono mt-0.5">
                            {user.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {/* Level & XP */}
                      <div>
                        <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-zinc-550 font-mono mb-1">
                          <span>Scribe Rank</span>
                          <span className="text-purple-400 font-black">Lvl {level}</span>
                        </div>
                        <div className="flex items-center gap-2 justify-between text-[11px] font-bold text-zinc-350">
                          <span className="font-cinzel truncate max-w-[150px]">
                            {getRankName(level, activeWorld.theme)}
                          </span>
                          <span className="font-mono text-[9px] shrink-0">{xp} / 1000 XP</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden mt-1.5 border border-zinc-850/40 shadow-inner">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(xp / 1000) * 100}%` }}
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" 
                          />
                        </div>
                      </div>

                      {/* Streak & Stability Grid */}
                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <div className="rounded-xl border border-zinc-900 bg-zinc-900/20 p-2.5">
                          <span className="block text-[8px] font-bold uppercase tracking-wider text-zinc-550 font-mono">Streak</span>
                          <span className="block text-xs font-black text-amber-400 mt-0.5 font-mono">🔥 {streak} Days</span>
                        </div>
                        <div className="rounded-xl border border-zinc-900 bg-zinc-900/20 p-2.5">
                          <span className="block text-[8px] font-bold uppercase tracking-wider text-zinc-550 font-mono">Stability</span>
                          <span className={`block text-xs font-black mt-0.5 font-mono ${stability < 30 ? 'text-red-400' : 'text-green-400'}`}>
                            ⚡ {stability}%
                          </span>
                        </div>
                      </div>

                      {/* Core Themes Quick Switch */}
                      <div className="border-t border-zinc-850/60 pt-3">
                        <span className="block text-[8px] font-bold uppercase tracking-wider text-zinc-550 font-mono mb-2">
                          Summon Core Themes
                        </span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {([
                            { id: 'fantasy', label: 'Fantasy', icon: '⚔️' },
                            { id: 'cyberpunk', label: 'Cyber', icon: '💻' },
                            { id: 'steampunk', label: 'Steam', icon: '⚙️' }
                          ] as const).map((t) => {
                            const isActive = activeWorld.theme === t.id
                            return (
                              <button
                                key={t.id}
                                onClick={() => handleChangeWorld(t.id)}
                                className={`py-1.5 px-1 rounded-xl text-[10px] font-bold border transition-all duration-300 flex flex-col items-center justify-center gap-1 cursor-pointer ${
                                  isActive
                                    ? 'border-purple-500/80 bg-purple-500/10 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.15)]'
                                    : 'border-zinc-900 bg-zinc-900/40 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                                }`}
                              >
                                <span className="text-[12px]">{t.icon}</span>
                                <span>{t.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-10 w-[1px] bg-zinc-800 hidden sm:block" />

            {/* Sign Out Button */}
            <button
              onClick={async () => {
                await logout()
              }}
              title={user.uid.startsWith('guest_') ? "Exit Demo Session" : "Sign Out of Portal"}
              className="flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-red-400 backdrop-blur-md transition-all duration-300 hover:bg-red-500/12 hover:scale-[1.03] active:scale-[0.97] hover:cursor-pointer"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">
                {user.uid.startsWith('guest_') ? 'Exit Demo' : 'Sign Out'}
              </span>
            </button>
          </div>
        </header>

        {/* XP Bar */}
        <XPBar xp={xp} level={level} theme={activeWorld.theme} streak={streak} />

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
                  <span className="hidden sm:inline">{isForging ? 'Starting…' : 'Start Adventure'}</span>
                </button>
              </form>

              {/* Campaign Architect Level Lock/Notice */}
              <div className="mt-3 flex items-center select-none">
                {level < 3 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800/80 bg-zinc-900/30 px-2.5 py-1 text-[11px] font-medium text-zinc-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                    Campaign Architect (3-part quests) unlocks at Level 3
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 px-2.5 py-1 text-[11px] font-semibold text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.05)] animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                    Campaign Architect Active: forging 3-part campaign sequence
                  </span>
                )}
              </div>

              {/* Category Override Selection / Campaign Notice */}
              <div className="mt-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between border-t border-zinc-800/40 pt-4">
                <div className="flex flex-col gap-1.5 flex-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-550 font-mono">
                    Category Tuning
                  </span>
                  {level < 3 ? (
                    <div className="flex flex-wrap gap-2">
                      {([
                        { key: 'auto', label: 'Auto Detect' },
                        { key: 'wisdom', label: 'Wisdom' },
                        { key: 'discipline', label: 'Discipline' },
                        { key: 'creation', label: 'Creation' }
                      ] as const).map((cat) => (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => setForgeCategory(cat.key)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-300 ${
                            forgeCategory === cat.key
                              ? `${colors.accentBg} ${colors.borderGlow} shadow-[0_0_15px_rgba(168,85,247,0.1)]`
                              : 'border-zinc-800/60 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <div className="flex items-center rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-1 shadow-inner backdrop-blur-sm">
                        <span className="rounded-lg px-2 py-1 text-[10px] font-black uppercase bg-purple-500/10 text-purple-300 border border-purple-500/15">
                          Wisdom <span className="text-purple-400/60 font-semibold text-[9px] lowercase">(Prep)</span>
                        </span>
                        <span className="mx-1.5 text-zinc-650 text-[9px] font-bold">➔</span>
                        <span className="rounded-lg px-2 py-1 text-[10px] font-black uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/15">
                          Creation <span className="text-cyan-400/60 font-semibold text-[9px] lowercase">(Build)</span>
                        </span>
                        <span className="mx-1.5 text-zinc-650 text-[9px] font-bold">➔</span>
                        <span className="rounded-lg px-2 py-1 text-[10px] font-black uppercase bg-orange-500/10 text-orange-350 border border-orange-500/15">
                          Discipline <span className="text-orange-400/60 font-semibold text-[9px] lowercase">(Test)</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Deadline Duration Selection */}
                <div className="flex flex-col gap-1.5 min-w-[200px]">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-550 font-mono">
                    Quest Timeframe
                  </span>
                  <div className="flex gap-2">
                    {([
                      { val: 1, label: '1 Day' },
                      { val: 3, label: '3 Days' },
                      { val: 7, label: '7 Days' }
                    ] as const).map((dur) => (
                      <button
                        key={dur.val}
                        type="button"
                        onClick={() => setForgeDuration(dur.val)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all duration-300 flex-1 text-center ${
                          forgeDuration === dur.val
                            ? `${colors.accentBg} ${colors.borderGlow} shadow-[0_0_15px_rgba(168,85,247,0.1)]`
                            : 'border-zinc-800/60 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                        }`}
                      >
                        {dur.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

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

              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`relative pb-3 text-sm font-bold uppercase tracking-wider transition ${activeTab === 'leaderboard' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <span className="flex items-center gap-2">
                  <Trophy size={14} />
                  Leaderboard
                </span>
                {activeTab === 'leaderboard' && (
                  <motion.div layoutId="activeTabUnderline" className={`absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r ${colors.btnBg}`} />
                )}
              </button>
            </div>

            {/* Content tabs */}
            <div>
              {activeTab === 'quests' && (
                <div className="space-y-4">
                  {/* Daily Challenge Section */}
                  {dailyChallenge && (filter === 'all' || dailyChallenge.category === filter) && (() => {
                    const rarity = getChallengeRarity(dailyChallenge.title)
                    const rarityStyles = {
                      common: {
                        cardClass: 'border-zinc-800/80 bg-zinc-950/40 shadow-md',
                        badgeClass: 'bg-zinc-800/20 border-zinc-700/30 text-zinc-400',
                        badgeText: '⚔️ Common Trial',
                        glowDot: 'bg-zinc-500'
                      },
                      rare: {
                        cardClass: 'border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 via-zinc-950/80 to-zinc-950/90 shadow-[0_0_20px_rgba(6,182,212,0.04)]',
                        badgeClass: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300',
                        badgeText: '🌀 Rare Trial',
                        glowDot: 'bg-cyan-400'
                      },
                      epic: {
                        cardClass: 'border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-zinc-950/80 to-zinc-950/90 shadow-[0_0_25px_rgba(168,85,247,0.08)]',
                        badgeClass: 'bg-purple-500/20 border-purple-500/30 text-purple-300',
                        badgeText: '⚡ Epic Trial',
                        glowDot: 'bg-purple-400 animate-pulse'
                      },
                      legendary: {
                        cardClass: 'border-amber-400/80 bg-gradient-to-br from-amber-500/10 via-zinc-950/80 to-black shadow-[0_0_35px_rgba(245,158,11,0.15)] legendary-card',
                        badgeClass: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
                        badgeText: '👑 Legendary Trial',
                        glowDot: 'bg-amber-400 animate-pulse'
                      }
                    }[rarity]

                    return (
                      <div className={`relative overflow-hidden rounded-[2rem] border p-8 mb-8 transition-all duration-500 ${rarityStyles.cardClass}`}>
                        {/* Decorative background pulse glow */}
                        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-amber-500/10 blur-3xl pointer-events-none animate-pulse" />
                        
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span className={`flex h-5 items-center justify-center rounded-full border px-3 text-[10px] font-bold tracking-wider uppercase font-mono ${rarityStyles.badgeClass}`}>
                                <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${rarityStyles.glowDot}`} />
                                {rarityStyles.badgeText}
                              </span>
                              {dailyChallenge.isCompleted ? (
                                <span className="flex h-5 items-center justify-center rounded-full bg-green-500/20 border border-green-500/30 px-3 text-[10px] font-bold text-green-400 tracking-wider uppercase font-mono">
                                  Chronicled
                                </span>
                              ) : (
                                <span className="flex h-5 items-center justify-center rounded-full bg-zinc-850 border border-zinc-700 px-3 text-[10px] font-bold text-zinc-400 tracking-wider uppercase font-mono">
                                  Active
                                </span>
                              )}
                              {streak > 0 && (
                                <span className="flex h-5 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/25 px-2.5 text-[9px] font-black text-amber-300 uppercase tracking-widest font-mono">
                                  🔥 {(1 + streak * 0.1).toFixed(1)}x XP Combo
                                </span>
                              )}
                            </div>
                            
                            <h3 className={`text-2xl font-black mt-3.5 tracking-tight font-cinzel ${dailyChallenge.isCompleted ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>
                              {dailyChallenge.title}
                            </h3>
                            <p className="mt-2 text-sm text-zinc-400 leading-relaxed font-serif italic">
                              {dailyChallenge.description}
                            </p>
                            
                            {/* Task Checkbox */}
                            {dailyChallenge.tasks && dailyChallenge.tasks.length > 0 && (
                              <div className="mt-5">
                                {dailyChallenge.tasks.map((task, i) => {
                                  const parts = task.split('|')
                                  const mainTask = parts[0]?.trim() || task
                                  const loreSubtitle = parts[1]?.trim() || ''
                                  return (
                                    <button
                                      key={i}
                                      onClick={() => handleCompleteDailyChallenge()}
                                      disabled={dailyChallenge.isCompleted || narratingId !== null || stability === 0}
                                      className={`flex items-start gap-4 w-full text-left p-4 rounded-2xl border transition-all duration-300 ${
                                        dailyChallenge.isCompleted 
                                          ? 'bg-green-500/5 border-green-500/10 shadow-[0_0_12px_rgba(34,197,94,0.04)] cursor-default' 
                                          : 'bg-zinc-900/20 border-zinc-850/55 hover:bg-amber-500/5 hover:border-amber-500/20 hover:shadow-[0_0_15px_rgba(245,158,11,0.05)] group cursor-pointer'
                                      }`}
                                    >
                                      <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                                        dailyChallenge.isCompleted 
                                          ? 'border-green-500 bg-green-500 text-white shadow-[0_0_8px_rgba(34,197,94,0.4)]' 
                                          : 'bg-zinc-950 border-zinc-750 group-hover:border-amber-400 group-hover:bg-amber-500/5 shadow-inner'
                                      }`}>
                                        {dailyChallenge.isCompleted && <Check size={11} strokeWidth={4} />}
                                      </div>
                                      <div className="flex-1 flex flex-col">
                                        <span className={`text-base font-semibold transition-all duration-300 ${
                                          dailyChallenge.isCompleted ? 'text-zinc-550 line-through' : 'text-zinc-200 group-hover:text-white'
                                        }`}>
                                          {mainTask}
                                        </span>
                                        {loreSubtitle && (
                                          <span className={`text-xs italic mt-1.5 font-serif tracking-wide transition-all duration-300 ${
                                            dailyChallenge.isCompleted ? 'text-zinc-650' : 'text-zinc-500'
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
                          </div>

                          <div className="flex flex-col items-center md:items-end justify-center gap-3 select-none">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-550 font-mono">Rewards</span>
                            <div className="flex gap-2.5">
                              <span className="h-9 flex items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 px-3.5 text-xs font-bold text-amber-300 font-mono">
                                +{rarity === 'legendary' ? 300 : rarity === 'epic' ? 200 : rarity === 'rare' ? 150 : 100} XP
                              </span>
                              <span className="h-9 flex items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 px-3.5 text-xs font-bold text-amber-300 font-mono">
                                +{rarity === 'legendary' ? 35 : rarity === 'epic' ? 25 : rarity === 'rare' ? 20 : 15}% Stability
                              </span>
                            </div>
                            {!dailyChallenge.isCompleted && (
                              <button
                                onClick={() => handleCompleteDailyChallenge()}
                                disabled={narratingId !== null || stability === 0}
                                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 border border-amber-500/30 px-5 py-2.5 text-xs font-bold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-50 shimmer-btn"
                              >
                                {narratingId === 9999 ? (
                                  <>
                                    <Loader2 size={12} className="animate-spin" />
                                    <span>Recording Trial...</span>
                                  </>
                                ) : (
                                  <>
                                    <Check size={12} />
                                    <span>Complete Trial</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })()}
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
              )}
              {activeTab === 'codex' && (
                <LoreCodex chapters={chapters} theme={activeWorld.theme} isWriting={isWritingChapter} />
              )}
              {activeTab === 'leaderboard' && (
                <Leaderboard theme={activeWorld.theme} activeUserUid={user.uid} />
              )}
            </div>
          </div>

          {/* Sidebar — unchanged */}
          <div className="space-y-6">
            <WorldArchitect
              activeWorld={activeWorld}
              onChangeWorld={handleChangeWorld}
              onForgeCustomWorld={handleForgeCustomWorld}
              stability={stability}
              level={level}
            />
            <KingdomStatus quests={quests} activeWorld={activeWorld} />
            <LoreFeed lore={lore} theme={activeWorld.theme} />
          </div>

        </div>
      </div>
    </main>
  )
}