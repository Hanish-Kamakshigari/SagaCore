'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Sparkles, ArrowLeft, Mail, Lock, Loader2, KeyRound, AlertCircle, ShieldAlert, Sparkle, Compass } from 'lucide-react'

export default function AuthPage() {
  const router = useRouter()
  const { user, login, register, loading, isMock, error, clearError } = useAuth()

  const [isLoginMode, setIsLoginMode] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    clearError()

    if (!email.trim() || !password.trim()) {
      setLocalError('Please fill in all fields.')
      return
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.')
      return
    }

    if (!isLoginMode && password !== confirmPassword) {
      setLocalError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      if (isLoginMode) {
        await login(email, password)
      } else {
        await register(email, password)
      }
    } catch (err: any) {
      console.error('Auth submission error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleMode = () => {
    setIsLoginMode((prev) => !prev)
    setPassword('')
    setConfirmPassword('')
    setLocalError(null)
    clearError()
  }

  const displayedError = localError || error

  return (
    <main className="relative min-h-screen bg-[#030303] px-6 py-12 text-white flex flex-col items-center justify-center overflow-hidden">
      {/* ─── Premium Custom CSS Keyframe Animations ─── */}
      <style jsx global>{`
        @keyframes float-slow-1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(50px, -60px) scale(1.2); }
          66% { transform: translate(-30px, 30px) scale(0.85); }
        }
        @keyframes float-slow-2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-60px, 50px) scale(1.25); }
        }
        @keyframes float-slow-3 {
          0%, 100% { transform: translate(0px, 0px) scale(1.1); }
          40% { transform: translate(40px, 40px) scale(0.9); }
        }
        @keyframes flow-grid {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        @keyframes text-shine {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes shine-slide {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        @keyframes float-ember-1 {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1); opacity: 0.25; }
          50% { transform: translateY(-80px) translateX(40px) scale(1.35); opacity: 0.65; }
        }
        @keyframes float-ember-2 {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1); opacity: 0.2; }
          50% { transform: translateY(-130px) translateX(-50px) scale(1.4); opacity: 0.55; }
        }
        @keyframes float-ember-3 {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1.2); opacity: 0.35; }
          50% { transform: translateY(-60px) translateX(30px) scale(0.95); opacity: 0.75; }
        }
        .animate-float-1 {
          animation: float-slow-1 18s ease-in-out infinite;
        }
        .animate-float-2 {
          animation: float-slow-2 22s ease-in-out infinite;
        }
        .animate-float-3 {
          animation: float-slow-3 15s ease-in-out infinite;
        }
        .animate-grid-shift {
          animation: flow-grid 20s linear infinite;
        }
        .animate-text-shine {
          background-size: 200% auto;
          animation: text-shine 5s ease infinite;
        }
        .animate-ember-1 {
          animation: float-ember-1 14s ease-in-out infinite;
        }
        .animate-ember-2 {
          animation: float-ember-2 18s ease-in-out infinite;
        }
        .animate-ember-3 {
          animation: float-ember-3 11s ease-in-out infinite;
        }
        .shine-button:hover::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.25) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: skewX(-25deg);
          animation: shine-slide 1.2s ease-in-out;
        }
      `}</style>

      {/* ─── Themed Portal Background System ─── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Dynamic drifting cosmic grid */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.035)_1px,transparent_1px)] bg-[size:50px_50px] opacity-80 animate-grid-shift" 
        />

        {/* Ambient Portal Center Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.12)_0%,rgba(3,3,3,0.85)_60%,#030303_100%)]" />

        {/* Multi-layered floating themed nebulas */}
        {/* High-Fantasy Purple (Wisdom) */}
        <div className="absolute -left-[10%] -top-[10%] h-[600px] w-[600px] rounded-full bg-purple-650/22 blur-[140px] animate-float-1" />
        
        {/* Cyberpunk Cyan (Creation) */}
        <div className="absolute -right-[10%] -bottom-[10%] h-[650px] w-[650px] rounded-full bg-cyan-500/20 blur-[155px] animate-float-2" />
        
        {/* Steampunk Orange (Discipline) */}
        <div className="absolute left-[25%] top-[25%] h-[500px] w-[500px] rounded-full bg-amber-500/12 blur-[130px] animate-float-3" />

        {/* Enchanted Floating Embers (replaces star dots) */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Ember 1 (Purple) */}
          <div className="absolute left-[15%] bottom-[15%] h-3.5 w-3.5 rounded-full bg-purple-400 blur-[2px] opacity-40 animate-ember-1" />
          <div className="absolute left-[17%] bottom-[17%] h-2 w-2 rounded-full bg-pink-300 blur-[1px] opacity-35 animate-ember-1" />
          
          {/* Ember 2 (Cyan) */}
          <div className="absolute right-[20%] bottom-[20%] h-4.5 w-4.5 rounded-full bg-cyan-400 blur-[3px] opacity-35 animate-ember-2" />
          <div className="absolute right-[22%] bottom-[22%] h-3 w-3 rounded-full bg-blue-300 blur-[2px] opacity-25 animate-ember-2" />
          
          {/* Ember 3 (Gold/Orange) */}
          <div className="absolute left-[40%] bottom-[25%] h-3 w-3 rounded-full bg-amber-450/50 blur-[2px] opacity-45 animate-ember-3" />
          <div className="absolute left-[41%] bottom-[27%] h-2 w-2 rounded-full bg-yellow-300 blur-[1px] opacity-35 animate-ember-3" />
          
          {/* Drifting Embers at higher heights */}
          <div className="absolute right-[35%] top-[30%] h-4 w-4 rounded-full bg-purple-400 blur-[3px] opacity-30 animate-ember-2" />
          <div className="absolute left-[10%] top-[35%] h-4.5 w-4.5 rounded-full bg-amber-400 blur-[4px] opacity-25 animate-ember-1" />
        </div>
      </div>

      {/* Interactive Back Link */}
      <div className="absolute top-8 left-8 z-50">
        <Link 
          href="/" 
          className="group flex items-center gap-2.5 rounded-full border border-white/5 bg-zinc-950/40 px-5 py-2.5 text-zinc-400 hover:border-purple-500/25 hover:text-white hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all duration-300 backdrop-blur-xl"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
          <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Back to Sanctum</span>
        </Link>
      </div>

      <div className="w-full max-w-[440px] mt-6 relative z-10 flex flex-col justify-center min-h-[80vh]">
        


        <div className="flex flex-col items-center mb-8 text-center">
          <motion.div 
            animate={{
              rotate: [0, 360],
              scale: [1, 1.05, 1],
            }}
            transition={{
              rotate: { duration: 25, repeat: Infinity, ease: 'linear' },
              scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
            }}
            className="h-14 w-14 rounded-2xl border border-purple-500/20 bg-gradient-to-tr from-purple-500/10 to-indigo-500/10 flex items-center justify-center text-purple-300 shadow-[0_0_30px_rgba(168,85,247,0.2)] mb-5"
          >
            <KeyRound size={24} />
          </motion.div>
          
          <div className="flex items-center gap-2">
            <span className="h-[1px] w-6 bg-purple-500/30" />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-purple-400 font-mono animate-pulse">SAGACORE HUB</span>
            <span className="h-[1px] w-6 bg-purple-500/30" />
          </div>

          <h2 className="text-4xl font-black tracking-tight mt-2 animate-text-shine bg-gradient-to-r from-white via-purple-100 to-pink-300 bg-clip-text text-transparent font-cinzel select-none">
            {isLoginMode ? 'Enter the Portal' : 'Forge a New Soul'}
          </h2>
          <p className="text-xs text-zinc-400 mt-3 max-w-xs leading-relaxed">
            {isLoginMode 
              ? 'Synchronize your mental focus, load your quest coordinates, and log in.' 
              : 'Begin a personalized chronicle. Deconstruct your goals into legendary levels.'}
          </p>
        </div>

        {/* Auth form card */}
        <div className="rounded-[32px] border border-white/5 bg-[#0a0a0c]/40 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] shadow-purple-500/5 backdrop-blur-3xl relative overflow-hidden transition-all duration-500 hover:border-purple-500/15 hover:shadow-[0_20px_50px_rgba(168,85,247,0.08)]">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-500/35 to-transparent" />
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {/* Error display */}
            <AnimatePresence mode="wait">
              {displayedError && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4.5 py-3.5 flex gap-3 items-center text-red-400 text-xs shadow-[0_0_15px_rgba(239,68,68,0.05)]"
                >
                  <AlertCircle size={16} className="shrink-0 text-red-400" />
                  <span className="leading-relaxed">{displayedError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-300 uppercase tracking-widest block pl-1">Email Coordinates</label>
              <div className="relative group">
                <Mail 
                  className="absolute left-4.5 top-1/2 -translate-y-1/2 text-zinc-450 transition-colors duration-300 group-focus-within:text-purple-400" 
                  size={16} 
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="hero@sagacore.com"
                  className="w-full rounded-2xl border border-white/10 bg-zinc-900/35 pl-12 pr-5 py-4 text-sm placeholder-zinc-550 outline-none transition-all duration-300 focus:border-purple-500/50 focus:bg-zinc-900/70 focus:shadow-[0_0_20px_rgba(168,85,247,0.15)] focus:ring-1 focus:ring-purple-500/5 disabled:opacity-50"
                  required
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-300 uppercase tracking-widest block pl-1">Secret Keyphrase</label>
              <div className="relative group">
                <Lock 
                  className="absolute left-4.5 top-1/2 -translate-y-1/2 text-zinc-450 transition-colors duration-300 group-focus-within:text-purple-400" 
                  size={16} 
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-white/10 bg-zinc-900/35 pl-12 pr-5 py-4 text-sm placeholder-zinc-550 outline-none transition-all duration-300 focus:border-purple-500/50 focus:bg-zinc-900/70 focus:shadow-[0_0_20px_rgba(168,85,247,0.15)] focus:ring-1 focus:ring-purple-500/5 disabled:opacity-50"
                  required
                />
              </div>
            </div>

            {/* Confirm Password input (only registration mode) */}
            <AnimatePresence>
              {!isLoginMode && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  className="overflow-hidden space-y-2"
                >
                  <label className="text-[10px] font-black text-zinc-300 uppercase tracking-widest block pl-1">Re-enter Keyphrase</label>
                  <div className="relative group">
                    <Lock 
                      className="absolute left-4.5 top-1/2 -translate-y-1/2 text-zinc-450 transition-colors duration-300 group-focus-within:text-purple-400" 
                      size={16} 
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isSubmitting}
                      placeholder="••••••••"
                      className="w-full rounded-2xl border border-white/10 bg-zinc-900/35 pl-12 pr-5 py-4 text-sm placeholder-zinc-550 outline-none transition-all duration-300 focus:border-purple-500/50 focus:bg-zinc-900/70 focus:shadow-[0_0_20px_rgba(168,85,247,0.15)] focus:ring-1 focus:ring-purple-500/5 disabled:opacity-50"
                      required={!isLoginMode}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full relative overflow-hidden group flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 py-4 font-bold text-white transition hover:brightness-110 active:scale-[0.98] shadow-lg shadow-purple-500/20 disabled:opacity-75 disabled:cursor-not-allowed hover:cursor-pointer shine-button"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin text-white" />
              ) : (
                <Sparkles size={15} className="group-hover:rotate-12 transition-transform duration-300" />
              )}
              <span className="tracking-wide">
                {isSubmitting 
                  ? (isLoginMode ? 'Opening Portal…' : 'Forging Soul…')
                  : (isLoginMode ? 'Enter Console' : 'Forge My Account')}
              </span>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition duration-300" />
            </button>

            {/* Mode switch */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={toggleMode}
                disabled={isSubmitting}
                className="text-xs text-zinc-400 hover:text-purple-400 transition-colors duration-300 font-bold tracking-wide hover:cursor-pointer"
              >
                {isLoginMode 
                  ? "Don't have a registered soul? Forge one here →" 
                  : 'Already have a registered soul? Enter portal →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
