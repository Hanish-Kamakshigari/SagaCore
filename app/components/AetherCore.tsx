'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { Sparkles, Cpu, BookOpen, Shield, ChevronRight, ChevronLeft, Compass, KeyRound, HelpCircle } from 'lucide-react'

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


export default function AetherCore() {
  const { user, loginAsGuest } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [userLevel, setUserLevel] = useState<number | null>(null)

  useEffect(() => {
    if (user) {
      const localLevel = localStorage.getItem(`sagacore_${user.uid}_level`)
      if (localLevel) {
        setUserLevel(JSON.parse(localLevel))
      }
    }
  }, [user])

  // Mouse tilt physics for premium card feel
  const cardRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { damping: 25, stiffness: 150, mass: 0.5 }
  const rotateX = useSpring(useTransform(mouseY, [-200, 200], [10, -10]), springConfig)
  const rotateY = useSpring(useTransform(mouseX, [-200, 200], [-10, 10]), springConfig)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    mouseX.set(x)
    mouseY.set(y)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
    setIsHovered(false)
  }

  const handleTryDemo = async () => {
    if (isLoggingIn) return
    setIsLoggingIn(true)
    try {
      await loginAsGuest()
      router.push('/dashboard')
    } catch (err) {
      console.error('Failed to launch guest session from Aether Core:', err)
    } finally {
      setIsLoggingIn(false)
    }
  }

  const levelName = userLevel ? getRankName(userLevel, 'fantasy') : null
  const firstStepDesc = levelName
    ? `Welcome back, ${levelName}. I am the Aether Core. I monitor your progress, forge quests, and scribe history. Let us resume your journey.`
    : "An interface to the SagaCore World Engine. I monitor your progress, forge quests, and scribe history. Let me show you how this realm functions."

  // Steps data
  const steps = [
    {
      title: "I am the Aether Core",
      desc: firstStepDesc,
      icon: HelpCircle,
      accent: "from-red-500/20 to-orange-500/20",
      iconColor: "text-amber-400"
    },
    {
      title: "1. The Dream Forge",
      desc: "Input any goal—no matter how large. We channel Gemini models to instantly forge it into a multi-phase questline complete with difficulty tiers and narrative context.",
      icon: Cpu,
      accent: "from-red-500/20 to-rose-500/20",
      iconColor: "text-red-400"
    },
    {
      title: "2. Realm Coherence",
      desc: "Your productivity directly shapes the world. Complete quests to stabilize the Realm. If you default on deadlines, the stability decays and triggers restoration trials.",
      icon: Shield,
      accent: "from-orange-500/20 to-amber-500/20",
      iconColor: "text-orange-400"
    },
    {
      title: "3. Adaptive Chronicles",
      desc: "Successes, milestones, and failures are immediately scribed into the Lore Codex. Watch your personal accomplishments form a living fantasy saga that grows with you.",
      icon: BookOpen,
      accent: "from-rose-500/20 to-red-500/20",
      iconColor: "text-rose-400"
    },
    {
      title: "Initiate Your Odyssey",
      desc: "The calibration sequence is ready. Enter as a guest explorer to experience the forge instantly, or register a permanent account to secure your legendary vault.",
      icon: Sparkles,
      accent: "from-amber-500/20 to-red-500/20",
      iconColor: "text-yellow-400"
    }
  ]

  return (
    <div className="relative w-full max-w-xl mx-auto z-30 select-none">
           {/* Perspective Wrapper */}
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={() => setIsHovered(true)}
        style={{ transformStyle: "preserve-3d" }}
        className="w-full rounded-3xl border border-zinc-800/80 bg-zinc-950/40 p-8 md:p-10 backdrop-blur-2xl transition-all duration-300 hover:border-red-500/25 hover:shadow-[0_0_50px_rgba(239,68,68,0.08)] flex flex-col items-center gap-8 relative overflow-hidden"
      >
        {/* Animated Background Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.08),transparent_70%)] pointer-events-none" />

        {/* ─── 3D PSEUDO-CANVAS COMPANION CONTAINER ─── */}
        <div className="relative w-72 h-72 flex items-center justify-center pointer-events-none" style={{ transformStyle: "preserve-3d" }}>
          
          {/* Ring 1 - Outer Runic Orbit */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            style={{ 
              transform: 'rotateX(72deg) rotateY(12deg)',
              transformStyle: 'preserve-3d'
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <svg className="w-full h-full text-red-500/35 filter drop-shadow-[0_0_8px_rgba(239,68,68,0.2)]" viewBox="0 0 300 300">
              <path id="runicPath1" d="M 150, 150 m -115, 0 a 115,115 0 1,1 230,0 a 115,115 0 1,1 -230,0" fill="none" />
              <text className="text-[11px] font-mono tracking-[0.22em] font-bold fill-red-400/80 uppercase">
                <textPath href="#runicPath1" startOffset="0%">
                  ✧ SAGACORE WORLD ENGINE ✧ LORE CODEX ACTIVE ✧ GEMINI PROTOCOL ✧
                </textPath>
              </text>
            </svg>
          </motion.div>

          {/* Ring 2 - Inner Orbit (Counter Rotating) */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
            style={{ 
              transform: 'rotateX(62deg) rotateY(-18deg)',
              transformStyle: 'preserve-3d'
            }}
            className="absolute inset-0 flex items-center justify-center scale-90"
          >
            <svg className="w-full h-full text-orange-500/30 filter drop-shadow-[0_0_6px_rgba(249,115,22,0.25)]" viewBox="0 0 300 300">
              <path id="runicPath2" d="M 150, 150 m -110, 0 a 110,110 0 1,1 220,0 a 110,110 0 1,1 -220,0" fill="none" />
              <text className="text-[9px] font-mono tracking-[0.3em] font-bold fill-orange-400/80 uppercase">
                <textPath href="#runicPath2" startOffset="50%">
                  ✧ AMBITION INTO LEGEND ✧ COHERENCE STABLE ✧ SYSTEM RUNNING ✧
                </textPath>
              </text>
            </svg>
          </motion.div>

          {/* Core Core Glow Spheres */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Ambient Radial Flare */}
            <motion.div
              animate={{ 
                scale: isHovered ? [1, 1.15, 1] : [1, 1.06, 1],
                opacity: isHovered ? [0.4, 0.65, 0.4] : [0.3, 0.45, 0.3]
              }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="absolute w-36 h-36 rounded-full bg-red-650/25 blur-3xl filter"
            />
          </div>

          {/* Crystalline Polyhedron Mesh Overlay */}
          <motion.div
            animate={{ 
              y: [-12, 12, -12],
              rotateY: isHovered ? 360 : [0, 360]
            }}
            transition={{
              y: { repeat: Infinity, duration: 5, ease: "easeInOut" },
              rotateY: isHovered 
                ? { duration: 5, ease: "linear", repeat: Infinity } 
                : { duration: 16, ease: "linear", repeat: Infinity }
            }}
            style={{ transformStyle: "preserve-3d" }}
            className="absolute w-32 h-32 flex items-center justify-center"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(239,68,68,0.45)]">
              {/* Face 1 */}
              <polygon points="50,10 80,40 50,55" className="fill-red-500/20 stroke-red-400/50 stroke-[0.7] backdrop-blur-[2px] transition-colors duration-300 hover:fill-red-400/30" />
              {/* Face 2 */}
              <polygon points="50,10 20,40 50,55" className="fill-orange-500/25 stroke-orange-400/50 stroke-[0.7] backdrop-blur-[2px] transition-colors duration-300 hover:fill-orange-400/35" />
              {/* Face 3 */}
              <polygon points="50,90 80,40 50,55" className="fill-red-650/30 stroke-red-500/60 stroke-[0.7] backdrop-blur-[2px] transition-colors duration-300 hover:fill-red-500/40" />
              {/* Face 4 */}
              <polygon points="50,90 20,40 50,55" className="fill-orange-600/35 stroke-orange-500/60 stroke-[0.7] backdrop-blur-[2px] transition-colors duration-300 hover:fill-orange-500/45" />
            </svg>
          </motion.div>

        </div>

        {/* ─── INTERACTIVE SPEECH BUBBLE DIALOGUE ─── */}
        <div className="w-full flex flex-col gap-4 relative z-10">
          
          {/* Glassmorphic Bubble */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 shadow-inner relative overflow-hidden`}
            >
              {/* Ambient step color flare */}
              <div className={`absolute top-0 right-0 h-24 w-24 rounded-full bg-gradient-to-br ${steps[step].accent} blur-xl pointer-events-none opacity-40`} />

              <div className="flex items-center gap-3 mb-2.5">
                <div className={`p-1.5 rounded-lg bg-white/5 border border-white/10 ${steps[step].iconColor}`}>
                  {(() => {
                    const Icon = steps[step].icon
                    return <Icon size={16} />
                  })()}
                </div>
                <h4 className="text-sm uppercase font-mono font-bold tracking-widest text-zinc-350">
                  {steps[step].title}
                </h4>
              </div>

              <p className="text-zinc-300 text-sm leading-relaxed min-h-[4.5rem]">
                {steps[step].desc}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Stepper Dots & Controls */}
          <div className="flex items-center justify-between mt-2 px-1">
            {/* Dots */}
            <div className="flex gap-2">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setStep(idx)}
                  className={`h-2 rounded-full transition-all duration-300 hover:cursor-pointer ${
                    idx === step ? 'w-6 bg-red-500' : 'w-2 bg-zinc-700 hover:bg-zinc-550'
                  }`}
                />
              ))}
            </div>

            {/* Back / Next Buttons */}
            <div className="flex items-center gap-2">
              <button
                disabled={step === 0}
                onClick={() => setStep(s => s - 1)}
                className="p-2 rounded-full border border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:text-white hover:border-zinc-700 active:scale-90 transition disabled:opacity-30 disabled:pointer-events-none hover:cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              
              {step < steps.length - 1 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  className="px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 text-red-300 text-xs font-semibold hover:border-red-500/50 hover:bg-red-500/20 active:scale-95 transition flex items-center gap-1 hover:cursor-pointer"
                >
                  <span>Learn More</span>
                  <ChevronRight size={14} />
                </button>
              ) : (
                <div className="flex gap-2">
                  {user ? (
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="px-5 py-2.5 rounded-full bg-gradient-to-r from-red-600 to-orange-500 text-white text-xs font-bold shadow-lg hover:shadow-red-500/15 active:scale-95 transition flex items-center gap-1 hover:cursor-pointer"
                    >
                      <Compass size={13} />
                      <span>Console</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleTryDemo}
                        disabled={isLoggingIn}
                        className="px-5 py-2.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs font-bold hover:bg-amber-500/20 active:scale-95 transition flex items-center gap-1 hover:cursor-pointer disabled:opacity-50"
                      >
                        {isLoggingIn ? (
                          <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Compass size={13} />
                        )}
                        <span>Try Demo</span>
                      </button>
                      <button
                        onClick={() => router.push('/auth')}
                        className="px-5 py-2.5 rounded-full border border-white/10 bg-white/5 text-white text-xs font-bold hover:bg-white/10 active:scale-95 transition flex items-center gap-1 hover:cursor-pointer"
                      >
                        <KeyRound size={13} />
                        <span>Sign In</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>

      </motion.div>
    </div>
  )
}
