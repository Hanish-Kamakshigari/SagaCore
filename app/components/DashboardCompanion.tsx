'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { Compass, X, Sparkles, AlertCircle, RefreshCw, Check, Send, MessageSquare, HelpCircle } from 'lucide-react'

import { Quest } from '../lib/data'
import { generateQuestQuizWithAI, chatWithCompanionWithAI } from '../lib/ai'

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



interface DashboardCompanionProps {
  quests: Quest[]
  theme: 'fantasy' | 'cyberpunk' | 'steampunk'
  stability: number
  onReward: (xpBonus: number, stabilityBonus: number, message: string) => void
  level: number
}

interface QuizData {
  question: string
  options: string[]
  answerIndex: number
  explanation: string
}

export default function DashboardCompanion({
  quests,
  theme,
  stability,
  onReward,
  level,
}: DashboardCompanionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(true)
  const [selectedQuestId, setSelectedQuestId] = useState<number | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizQuestions, setQuizQuestions] = useState<QuizData[] | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isHoveringClose, setIsHoveringClose] = useState(false)

  // Chat/Guide Conversation States
  interface ChatMessage {
    role: 'user' | 'model'
    content: string
  }

  const levelName = getRankName(level, theme)
  const defaultGreeting = `Greetings, ${levelName}. I am the Aether Core, your companion and guide. Speak to me, and I shall outline the scrolls of this world, or help you debug the layout structures of your active quests.`

  const [activeMode, setActiveMode] = useState<'chat' | 'quiz'>('chat')
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'model', content: defaultGreeting }
  ])
  const [chatLoading, setChatLoading] = useState(false)
  const [message, setMessage] = useState<string>(defaultGreeting)

  useEffect(() => {
    // Only update if the user hasn't sent any messages in the chat yet
    if (chatHistory.length === 1 && chatHistory[0].role === 'model') {
      setChatHistory([{ role: 'model', content: defaultGreeting }])
      if (activeMode === 'chat') {
        setMessage(defaultGreeting)
      }
    }
  }, [level, theme, defaultGreeting])


  // Tilt physics for card hover
  const cardRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { damping: 25, stiffness: 150, mass: 0.5 }
  const rotateX = useSpring(useTransform(mouseY, [-200, 200], [2.5, -2.5], { clamp: true }), springConfig)
  const rotateY = useSpring(useTransform(mouseX, [-200, 200], [-2.5, 2.5], { clamp: true }), springConfig)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isHoveringClose) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    mouseX.set(x)
    mouseY.set(y)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  // Active incomplete quests
  const activeQuests = quests.filter(q => !q.isCompleted && q.id !== 9999)

  const starterPrompts = [
    {
      label: activeQuests.length > 0 
        ? "Guide my active quests" 
        : "How do I forge a quest?",
      text: activeQuests.length > 0 
        ? "Can you guide me through my active quests and suggest a strategy?" 
        : "How do I use the Dream Forge to create a quest?"
    },
    {
      label: "Explain Realm Stability",
      text: "What is Realm Stability, and what happens if it drops?"
    },
    {
      label: "How does SagaCore work?",
      text: "Can you explain the main mechanics of SagaCore?"
    },
    {
      label: theme === 'fantasy' 
        ? "Tell me about the Mana Spires" 
        : theme === 'cyberpunk' 
          ? "Tell me about the Neon Grid" 
          : "Tell me about the Clockwork Gearwork",
      text: theme === 'fantasy' 
        ? "What is the lore behind the fantasy theme and the Mana Spires?" 
        : theme === 'cyberpunk' 
          ? "What is the lore behind the cyberpunk theme and the Neon Grid?" 
          : "What is the lore behind the steampunk theme and the Clockwork Gearwork?"
    }
  ]

  const handleStartQuiz = async () => {
    const activeId = selectedQuestId || (activeQuests.length > 0 ? activeQuests[0].id : null)
    if (activeId === null) return
    const quest = activeQuests.find(q => q.id === activeId)
    if (!quest) return

    setQuizLoading(true)
    setQuizQuestions(null)
    setCurrentQuestionIndex(0)
    setSelectedOption(null)
    setHasSubmitted(false)
    setMessage(`Calibrating the aether grid for: "${quest.title}"…`)

    try {
      const result = await generateQuestQuizWithAI(
        quest.title,
        quest.description,
        quest.tasks || [],
        theme
      )
      setQuizQuestions(result)
      setMessage("Grid calibrated! Solve these 3 diagnostic riddles to synchronize your records (Stage 1/3).")
    } catch (err) {
      console.error(err)
      setMessage("Calibration failed. The local archives could not be reached. Try again.")
    } finally {
      setQuizLoading(false)
    }
  }

  const handleSubmitAnswer = () => {
    const activeId = selectedQuestId || (activeQuests.length > 0 ? activeQuests[0].id : null)
    if (!quizQuestions || selectedOption === null || activeId === null) return
    const quest = activeQuests.find(q => q.id === activeId)
    if (!quest) return

    const currentQuiz = quizQuestions[currentQuestionIndex]
    const correct = selectedOption === currentQuiz.answerIndex
    setHasSubmitted(true)

    const stageText = `[Stage ${currentQuestionIndex + 1}/3]`
    if (correct) {
      setMessage(`${stageText} Magnificent! Your understanding is aligned. ${currentQuiz.explanation}`)
      onReward(50, 15, `✧ Diagnostic Stage ${currentQuestionIndex + 1} Cleared: Verified knowledge for quest "${quest.title}"`)
    } else {
      setMessage(`${stageText} Diagnostics failed! An electric feedback loop ripples through the realm. The correct answer was: "${currentQuiz.options[currentQuiz.answerIndex]}". ${currentQuiz.explanation}`)
      onReward(0, -5, `🌑 Diagnostics Stage ${currentQuestionIndex + 1} Failed: Failed knowledge trial for quest "${quest.title}" (-5% Stability)`)
    }
  }

  const handleNextQuestion = () => {
    if (!quizQuestions) return
    const nextIdx = currentQuestionIndex + 1
    setCurrentQuestionIndex(nextIdx)
    setSelectedOption(null)
    setHasSubmitted(false)
    setMessage(`Initiating Stage ${nextIdx + 1} Calibration. Review the coordinates and select your validation path.`)
  }

  const handleReset = () => {
    setQuizQuestions(null)
    setCurrentQuestionIndex(0)
    setSelectedOption(null)
    setHasSubmitted(false)
    if (activeQuests.length > 0) {
      setSelectedQuestId(activeQuests[0].id)
    }
    setMessage("Select a quest from your ledger to initiate another coherence trial.")
  }

  const submitMessage = async (text: string) => {
    if (!text.trim() || chatLoading) return

    const userText = text.trim()
    setChatLoading(true)

    const updatedHistory: ChatMessage[] = [
      ...chatHistory,
      { role: 'user', content: userText }
    ]
    setChatHistory(updatedHistory)
    setMessage("Analyzing code registers and translating lore frequency…")

    try {
      const activeQuests = quests.filter(q => !q.isCompleted && q.id !== 9999)
      const aiReply = await chatWithCompanionWithAI(
        userText,
        chatHistory,
        activeQuests,
        theme
      )
      setMessage(aiReply)
      setChatHistory([
        ...updatedHistory,
        { role: 'model', content: aiReply }
      ])
    } catch (err) {
      console.error(err)
      setMessage("A distortion ripple blocked the telepathic line. Type again to retry.")
    } finally {
      setChatLoading(false)
    }
  }

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading) return
    const text = chatInput
    setChatInput('')
    await submitMessage(text)
  }

  const handleTabChange = (mode: 'chat' | 'quiz') => {
    setActiveMode(mode)
    if (mode === 'chat') {
      const latestModelMsg = [...chatHistory].reverse().find(m => m.role === 'model')?.content || defaultGreeting
      setMessage(latestModelMsg)
    } else {
      if (quizQuestions) {
        const stageText = `[Stage ${currentQuestionIndex + 1}/3]`
        if (hasSubmitted) {
          const currentQuiz = quizQuestions[currentQuestionIndex]
          const correct = selectedOption === currentQuiz.answerIndex
          if (correct) {
            setMessage(`${stageText} Magnificent! Your understanding is aligned. ${currentQuiz.explanation}`)
          } else {
            setMessage(`${stageText} Diagnostics failed! An electric feedback loop ripples through the realm. The correct answer was: "${currentQuiz.options[currentQuiz.answerIndex]}". ${currentQuiz.explanation}`)
          }
        } else {
          setMessage("Grid calibrated! Solve these 3 diagnostic riddles to synchronize your records.")
        }
      } else {
        setMessage("Select a quest from your ledger to initiate a technical coherence diagnostics trial.")
      }
    }
  }

  // Theme-aware styles
  const themeColors = {
    fantasy: {
      accent: "text-[#a78bfa] border-[#7B4FCC]/20 bg-[#7B4FCC]/5",
      btn: "bg-gradient-to-r from-[#7B4FCC] to-[#633BB3] hover:shadow-[0_0_15px_rgba(123,79,204,0.25)]",
      glow: "bg-[#7B4FCC]/10",
      badge: "border-[#7B4FCC]/30 text-[#c4b5fd] bg-[#7B4FCC]/10",
    },
    cyberpunk: {
      accent: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5",
      btn: "bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-cyan-500/10",
      glow: "bg-cyan-500/10",
      badge: "border-cyan-500/30 text-cyan-300 bg-cyan-500/10",
    },
    steampunk: {
      accent: "text-orange-400 border-orange-500/20 bg-orange-500/5",
      btn: "bg-gradient-to-r from-orange-500 to-amber-500 hover:shadow-orange-500/10",
      glow: "bg-orange-500/10",
      badge: "border-orange-500/30 text-orange-400 bg-orange-500/10",
    }
  }[theme]

  const coreVisuals = {
    fantasy: {
      glow: "bg-[#7B4FCC]/15",
      borderHover: "hover:border-[#7B4FCC]/40",
      text: "text-[#a78bfa]",
      shadow: "drop-shadow-[0_0_10px_rgba(123,79,204,0.5)]",
      shadowLarge: "drop-shadow-[0_0_12px_rgba(123,79,204,0.55)]",
      fill1: "fill-[#7B4FCC]/25 stroke-[#a78bfa]/60",
      fill2: "fill-indigo-500/30 stroke-indigo-400/60",
      fill3: "fill-[#633BB3]/35 stroke-[#7B4FCC]/70",
      fill4: "fill-indigo-600/40 stroke-indigo-500/70",
      progressBar: "bg-[#7B4FCC]",
      selectedOptionBorder: "border-[#7B4FCC]/60 bg-[#7B4FCC]/10 text-purple-200 shadow-[0_0_15px_rgba(123,79,204,0.08)]",
      selectedOptionCircle: "border-[#7B4FCC] bg-[#7B4FCC] text-white",
      focusBorder: "focus:border-[#7B4FCC]/50",
      spinner: "border-[#7B4FCC]/20 border-t-[#7B4FCC]",
    },
    cyberpunk: {
      glow: "bg-cyan-500/15",
      borderHover: "hover:border-cyan-500/40",
      text: "text-cyan-400",
      shadow: "drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]",
      shadowLarge: "drop-shadow-[0_0_12px_rgba(6,182,212,0.55)]",
      fill1: "fill-cyan-500/25 stroke-cyan-400/60",
      fill2: "fill-blue-500/30 stroke-blue-400/60",
      fill3: "fill-cyan-600/35 stroke-cyan-500/70",
      fill4: "fill-blue-600/40 stroke-blue-500/70",
      progressBar: "bg-cyan-500",
      selectedOptionBorder: "border-cyan-500/60 bg-cyan-500/10 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.08)]",
      selectedOptionCircle: "border-cyan-500 bg-cyan-500 text-black",
      focusBorder: "focus:border-cyan-500/50",
      spinner: "border-cyan-500/20 border-t-cyan-500",
    },
    steampunk: {
      glow: "bg-orange-500/15",
      borderHover: "hover:border-orange-500/40",
      text: "text-orange-400",
      shadow: "drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]",
      shadowLarge: "drop-shadow-[0_0_12px_rgba(249,115,22,0.55)]",
      fill1: "fill-orange-500/25 stroke-orange-400/60",
      fill2: "fill-amber-500/30 stroke-amber-400/60",
      fill3: "fill-orange-600/35 stroke-orange-500/70",
      fill4: "fill-amber-600/40 stroke-amber-500/70",
      progressBar: "bg-orange-500",
      selectedOptionBorder: "border-orange-500/60 bg-orange-500/10 text-orange-200 shadow-[0_0_15px_rgba(249,115,22,0.08)]",
      selectedOptionCircle: "border-orange-500 bg-orange-500 text-black",
      focusBorder: "focus:border-orange-500/50",
      spinner: "border-orange-500/20 border-t-orange-500",
    }
  }[theme]


  return (
    <>
      {/* ─── TOOLTIP GUIDE TO START CONVERSATION ─── */}
      <AnimatePresence>
        {!isOpen && showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            transition={{ delay: 0.5 }}
            className="fixed bottom-24 right-6 z-40 max-w-[200px] rounded-xl border border-zinc-850 bg-zinc-950/95 p-3 shadow-2xl backdrop-blur-md flex flex-col gap-1.5"
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowTooltip(false)
              }}
              className="absolute top-1.5 right-1.5 p-0.5 rounded text-zinc-550 hover:text-zinc-300 transition hover:cursor-pointer"
            >
              <X size={10} />
            </button>
            <div className="flex items-center gap-1.5">
              <Sparkles size={11} className={coreVisuals.text} />
              <span className={`text-[9px] font-black tracking-widest uppercase font-mono ${coreVisuals.text}`}>Aether Guide</span>
            </div>
            <p className="text-[10px] text-zinc-350 leading-relaxed font-mono">
              Click to start a conversation to guide your quest steps!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MINIMIZED FLOATING ICON ─── */}
      <motion.button
        onClick={() => {
          setIsOpen(true)
          setShowTooltip(false)
        }}
        className={`fixed bottom-6 right-6 z-40 h-16 w-16 rounded-full border border-zinc-800 bg-zinc-950/80 backdrop-blur-md shadow-2xl flex items-center justify-center cursor-pointer transition-all duration-300 ${coreVisuals.borderHover}`}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className={`absolute inset-0 rounded-full blur-lg animate-pulse ${coreVisuals.glow}`} />
        {/* Tilting crystalline sphere */}
        <motion.div
          animate={{ rotateY: 360, y: [-2, 2, -2] }}
          transition={{
            rotateY: { repeat: Infinity, duration: 8, ease: "linear" },
            y: { repeat: Infinity, duration: 3, ease: "easeInOut" }
          }}
          className={`w-10 h-10 flex items-center justify-center ${coreVisuals.text}`}
        >
          <svg viewBox="0 0 100 100" className={`w-full h-full ${coreVisuals.shadow}`}>
            <polygon points="50,10 80,40 50,55" className={`${coreVisuals.fill1} stroke-[1.2]`} />
            <polygon points="50,10 20,40 50,55" className={`${coreVisuals.fill2} stroke-[1.2]`} />
            <polygon points="50,90 80,40 50,55" className={`${coreVisuals.fill3} stroke-[1.2]`} />
            <polygon points="50,90 20,40 50,55" className={`${coreVisuals.fill4} stroke-[1.2]`} />
          </svg>
        </motion.div>
      </motion.button>

      {/* ─── EXPANDED WIDGET MODAL ─── */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-[2px] flex justify-center items-start py-8 md:py-12 px-4">
            
            {/* Click outside to close */}
            <div className="fixed inset-0" onClick={() => setIsOpen(false)} />

            {/* Main Panel */}
            <motion.div
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
              initial={{ scale: 0.94, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="relative z-10 w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-950/95 p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl pointer-events-auto flex flex-col gap-6"
            >
              
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                onMouseEnter={() => {
                  setIsHoveringClose(true)
                  mouseX.set(0)
                  mouseY.set(0)
                }}
                onMouseLeave={() => setIsHoveringClose(false)}
                className="absolute top-4 right-4 p-2 rounded-xl border border-zinc-900 bg-zinc-900/40 text-zinc-550 hover:text-white hover:border-zinc-750 active:scale-90 transition hover:cursor-pointer"
              >
                <X size={14} />
              </button>

              {/* Title & Badge */}
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg border ${themeColors.accent}`}>
                  <Sparkles size={16} />
                </div>
                <div>
                  <span className={`text-[10px] font-black tracking-widest ${coreVisuals.text} uppercase font-mono`}>Aether Companion</span>
                  <h3 className="text-xl font-bold font-cinzel text-white leading-tight">Aether Core Diagnostics</h3>
                </div>
              </div>

              {/* Mode Selector Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-900/40 border border-zinc-850/60 relative z-20">
                <button
                  type="button"
                  onClick={() => handleTabChange('chat')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeMode === 'chat'
                      ? `${themeColors.badge} shadow-sm font-black`
                      : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                  }`}
                >
                  <MessageSquare size={13} />
                  <span>Aether Guide Chat</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('quiz')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeMode === 'quiz'
                      ? `${themeColors.badge} shadow-sm font-black`
                      : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                  }`}
                >
                  <Sparkles size={13} />
                  <span>Quest Diagnostics</span>
                </button>
              </div>

              {/* Character Visual */}
              <div className="flex items-start gap-4 bg-zinc-900/30 border border-zinc-850 rounded-2xl p-4 relative overflow-hidden">
                <div className={`${themeColors.glow} absolute top-0 right-0 h-24 w-24 rounded-full blur-xl opacity-40 pointer-events-none`} />
                
                {/* Miniature Crystal Mesh */}
                <div className="w-16 h-16 shrink-0 mt-1 relative flex items-center justify-center">
                  <motion.div
                    animate={{ rotateY: 360, y: [-4, 4, -4] }}
                    transition={{
                      rotateY: { repeat: Infinity, duration: 10, ease: "linear" },
                      y: { repeat: Infinity, duration: 4, ease: "easeInOut" }
                    }}
                    className={`w-12 h-12 ${coreVisuals.text}`}
                  >
                    <svg viewBox="0 0 100 100" className={`w-full h-full ${coreVisuals.shadowLarge}`}>
                      <polygon points="50,10 80,40 50,55" className={`${coreVisuals.fill1} stroke-[0.8]`} />
                      <polygon points="50,10 20,40 50,55" className={`${coreVisuals.fill2} stroke-[0.8]`} />
                      <polygon points="50,90 80,40 50,55" className={`${coreVisuals.fill3} stroke-[0.8]`} />
                      <polygon points="50,90 20,40 50,55" className={`${coreVisuals.fill4} stroke-[0.8]`} />
                    </svg>
                  </motion.div>
                </div>

                {/* Dialog Bubble */}
                <p className="text-xs text-zinc-300 leading-relaxed font-mono">
                  &quot;{message}&quot;
                </p>
              </div>

              {/* ─── CHAT/GUIDE CONVERSATION MODE ─── */}
              {activeMode === 'chat' && (
                <div className="flex flex-col gap-4">
                  {/* Chat History Log */}
                  {chatHistory.length > 1 ? (
                    <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1 border-t border-zinc-900/60 pt-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-550 font-mono">
                          Recent Log Coordinates
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setChatHistory([
                              { role: 'model', content: defaultGreeting }
                            ])
                            setMessage(defaultGreeting)
                          }}
                          className="text-[9px] font-mono font-bold text-zinc-555 hover:text-zinc-300 flex items-center gap-1 cursor-pointer hover:underline"
                        >
                          <RefreshCw size={10} />
                          <span>Reset Logs</span>
                        </button>
                      </div>
                      <div className="space-y-2.5">
                        {chatHistory.slice(0, -1).map((msg, idx) => (
                          <div 
                            key={idx} 
                            className={`text-[11px] font-mono leading-relaxed p-2.5 rounded-xl border ${
                              msg.role === 'user' 
                                ? 'bg-zinc-900/20 border-zinc-850 text-zinc-300 ml-6 text-right' 
                                : 'bg-black/20 border-zinc-900/40 text-zinc-400 mr-6'
                            }`}
                          >
                            <span className="block text-[8px] uppercase tracking-wider font-bold text-zinc-500 mb-0.5 font-mono">
                              {msg.role === 'user' ? 'Scribe' : 'Aether Core'}
                            </span>
                            {msg.content}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 border-t border-zinc-900/60 pt-3">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-550 font-mono mb-1">
                        Select a coordinate to begin query
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {starterPrompts.map((prompt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => submitMessage(prompt.text)}
                            disabled={chatLoading}
                            className={`text-[10px] text-left font-mono p-2.5 rounded-xl border border-zinc-900 bg-zinc-900/10 text-zinc-350 hover:border-zinc-800 hover:bg-zinc-900/30 transition-all duration-200 flex items-start gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <Sparkles size={11} className={`${coreVisuals.text} shrink-0 mt-0.5`} />
                            <span className="leading-snug">{prompt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chat Input */}
                  <form onSubmit={handleSendChatMessage} className="flex gap-2 border-t border-zinc-900/60 pt-4">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={chatLoading}
                      placeholder="Ask the Core how to guide your quest steps..."
                      className={`flex-1 rounded-xl border border-zinc-850 bg-black/40 px-4 py-2.5 text-xs placeholder-zinc-550 outline-none transition ${coreVisuals.focusBorder} disabled:opacity-50 text-zinc-200`}
                    />
                    <button
                      type="submit"
                      disabled={chatLoading || !chatInput.trim()}
                      className={`flex items-center justify-center rounded-xl px-4 text-white hover:shadow-lg active:scale-95 transition hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${themeColors.btn}`}
                    >
                      {chatLoading ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send size={13} />
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* ─── QUEST DIAGNOSTICS MODE ─── */}
              {activeMode === 'quiz' && (
                <>
                  {/* Quest Selector State */}
                  {!quizQuestions && !quizLoading && (
                    <div className="flex flex-col gap-4">
                      {activeQuests.length === 0 ? (
                        <div className="flex flex-col items-center text-center py-6 px-4 bg-zinc-900/10 border border-dashed border-zinc-850 rounded-2xl">
                          <Compass size={24} className="text-zinc-700 mb-2" />
                          <span className="text-xs font-semibold text-zinc-550 leading-relaxed max-w-xs">
                            Scribe, there are no active quests in this theme. Forge a new goal in the Dream Forge first.
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-mono">
                              Choose Active Quest
                            </label>
                            <select
                              value={selectedQuestId || activeQuests[0]?.id || ''}
                              onChange={(e) => setSelectedQuestId(Number(e.target.value))}
                              className={`w-full rounded-xl border border-zinc-850 bg-black/40 px-4 py-3 text-xs outline-none ${coreVisuals.focusBorder}`}
                            >
                              {activeQuests.map((q) => (
                                <option key={q.id} value={q.id} className="bg-zinc-950 text-zinc-200">
                                  [{q.category.toUpperCase()}] {q.title}
                                </option>
                              ))}
                            </select>
                          </div>

                          {stability === 0 ? (
                            <div className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-xs text-red-300 leading-relaxed">
                              <AlertCircle size={15} className="shrink-0 text-red-400" />
                              <span>
                                <strong>Realm cores are frozen.</strong> Stability is at 0%. Execute a Restoration Trial on the dashboard to unlock diagnostics.
                              </span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handleStartQuiz}
                              className={`w-full py-3.5 rounded-xl font-bold text-white text-xs tracking-wider uppercase shadow-lg transition active:scale-98 cursor-pointer ${themeColors.btn}`}
                            >
                              Begin Diagnostic Trial
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Loading State */}
                  {quizLoading && (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <div className={`absolute inset-0 rounded-full border-2 animate-spin ${coreVisuals.spinner}`} />
                        <Compass size={18} className={`animate-pulse ${coreVisuals.text}`} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-550 font-mono mt-4">
                        Decrypting Lore Codex…
                      </span>
                    </div>
                  )}

                  {/* Quiz Panel State */}
                  {quizQuestions && !quizLoading && quizQuestions[currentQuestionIndex] && (
                    <div className="flex flex-col gap-5">
                      
                      {/* Progress Indicator */}
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-550">
                        <span>Calibration Progress</span>
                        <span className={`${coreVisuals.text}`}>Stage {currentQuestionIndex + 1} of {quizQuestions.length}</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${coreVisuals.progressBar}`}
                          style={{ width: `${((currentQuestionIndex + (hasSubmitted ? 1 : 0)) / quizQuestions.length) * 100}%` }}
                        />
                      </div>

                      {/* Question */}
                      <div className="p-4 rounded-xl border border-zinc-850 bg-black/35 font-serif italic text-sm text-zinc-200 leading-relaxed">
                        {quizQuestions[currentQuestionIndex].question}
                      </div>

                      {/* Options List */}
                      <div className="space-y-2.5">
                        {quizQuestions[currentQuestionIndex].options.map((opt, idx) => {
                          const isSelected = selectedOption === idx
                          let optionBorder = 'border-zinc-850 bg-zinc-900/10 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/30'
                          
                          if (hasSubmitted) {
                            if (idx === quizQuestions[currentQuestionIndex].answerIndex) {
                              optionBorder = 'border-green-500/50 bg-green-500/10 text-green-300 font-semibold shadow-[0_0_15px_rgba(34,197,94,0.06)]'
                            } else if (isSelected) {
                              optionBorder = 'border-red-500/50 bg-red-500/10 text-red-300 line-through'
                            } else {
                              optionBorder = 'border-zinc-900 bg-zinc-950/20 text-zinc-550 opacity-40'
                            }
                          } else if (isSelected) {
                            optionBorder = coreVisuals.selectedOptionBorder
                          }

                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={hasSubmitted}
                              onClick={() => setSelectedOption(idx)}
                              className={`flex items-start gap-3 w-full text-left p-3.5 rounded-xl border text-xs transition duration-200 cursor-pointer disabled:cursor-default ${optionBorder}`}
                            >
                              <div className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border text-[9px] font-mono font-bold ${
                                isSelected 
                                  ? coreVisuals.selectedOptionCircle
                                  : 'border-zinc-700 bg-black/40 text-zinc-550'
                              }`}>
                                {['A', 'B', 'C', 'D'][idx]}
                              </div>
                              <span className="flex-1">{opt}</span>
                              {hasSubmitted && idx === quizQuestions[currentQuestionIndex].answerIndex && (
                                <Check size={12} className="text-green-400 shrink-0 self-center" strokeWidth={3} />
                              )}
                              {hasSubmitted && isSelected && idx !== quizQuestions[currentQuestionIndex].answerIndex && (
                                <X size={12} className="text-red-400 shrink-0 self-center" strokeWidth={3} />
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 mt-2">
                        {!hasSubmitted ? (
                          <button
                            type="button"
                            onClick={handleSubmitAnswer}
                            disabled={selectedOption === null}
                            className={`w-full py-3 rounded-xl font-bold text-white text-xs tracking-wider uppercase shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${themeColors.btn}`}
                          >
                            Submit Verification
                          </button>
                        ) : (
                          <>
                            {currentQuestionIndex < quizQuestions.length - 1 ? (
                              <button
                                type="button"
                                onClick={handleNextQuestion}
                                className={`w-full py-3 rounded-xl font-bold text-white text-xs tracking-wider uppercase shadow-lg transition active:scale-98 cursor-pointer ${themeColors.btn}`}
                              >
                                Advance to Stage {currentQuestionIndex + 2}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={handleReset}
                                className="w-full py-3 rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-350 font-bold text-xs tracking-wider uppercase hover:bg-zinc-900/60 active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Sparkles size={12} className="text-amber-400" />
                                <span>Complete Diagnostics</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>

                    </div>
                  )}
                </>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
