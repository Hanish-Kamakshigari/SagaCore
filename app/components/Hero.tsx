'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { LogOut, LayoutDashboard, KeyRound, Sparkles, Sparkle, Compass } from 'lucide-react'

export default function Hero() {
  const { user, logout, loginAsGuest } = useAuth()
  const router = useRouter()

  const handleTryDemo = async () => {
    try {
      await loginAsGuest()
      router.push('/dashboard')
    } catch (err) {
      console.error('Failed to launch guest session from landing page:', err)
    }
  }

  return (
    <section id="home" className="relative min-h-screen overflow-hidden text-white bg-black">      

      {/* Background image - fully visible with smooth zoom */}
      <motion.div
        animate={{
          scale: [1, 1.03, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/image.webp')",
        }}
      />

      {/* Star Particles Overlay removed for visual simplicity */}

      {/* Multi-layer premium overlay - darker at the top to pop the navbar, open in the middle for background visibility, dark at the bottom to transition */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/90 pointer-events-none" />

      {/* Soft color glow matching the ambient aesthetic */}
      <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-700/15 blur-[120px] pointer-events-none" />

      {/* Floating Navbar - integrated smoothly with absolute positioning */}
      <header className="absolute top-3 sm:top-6 left-1/2 z-50 w-[95%] sm:w-[92%] max-w-6xl -translate-x-1/2 pointer-events-auto">
        <nav className="flex items-center justify-between rounded-full border border-white/10 bg-black/35 px-4 py-2 sm:px-8 sm:py-3.5 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-red-700/25">
          {/* Logo / Brand */}
          <Link href="/" className="flex flex-col items-start select-none group shrink-0">
            <span className="text-sm sm:text-xl font-black tracking-[0.15em] sm:tracking-[0.2em] text-white font-cinzel bg-gradient-to-r from-white via-red-100 to-orange-200 bg-clip-text text-transparent group-hover:from-white group-hover:via-red-200 group-hover:to-orange-300 transition-all duration-300 whitespace-nowrap">
              SAGACORE HUB
            </span>
            <span className="text-[7px] sm:text-[8px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-red-400 font-bold font-mono -mt-0.5 pl-0.5 group-hover:text-red-300 transition-colors duration-300">
              World Engine
            </span>
          </Link>
 
          {/* Navigation Links */}
          <div className="hidden items-center gap-8 text-sm font-medium text-zinc-300 md:flex">
            {['Home', 'Features', 'About', 'Roadmap'].map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                className="relative py-1 transition-colors duration-200 hover:text-white after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-red-400 after:transition-all after:duration-300 hover:after:w-full"
              >
                {link}
              </a>
            ))}
          </div>
 
          {/* CTA / Console */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {user ? (
              <>
                <Link href="/dashboard">
                  <button className="rounded-full border border-red-700/30 bg-red-700/10 px-3 py-1.5 sm:px-5 sm:py-2.5 text-[10px] sm:text-xs font-semibold text-red-300 backdrop-blur-md transition-all duration-300 hover:border-red-600/50 hover:bg-red-700/20 hover:scale-[1.03] active:scale-[0.98] flex items-center gap-1 sm:gap-1.5 hover:cursor-pointer">
                    <LayoutDashboard size={11} className="sm:w-3 sm:h-3" />
                    <span>Console</span>
                  </button>
                </Link>
                <button
                  onClick={() => logout()}
                  aria-label="Sign Out"
                  className="rounded-full border border-red-500/20 bg-red-500/5 px-3 py-1.5 sm:px-4 sm:py-2.5 text-[10px] sm:text-xs font-semibold text-red-400 backdrop-blur-md transition-all duration-300 hover:bg-red-500/10 hover:scale-[1.03] active:scale-[0.98] flex items-center gap-1 sm:gap-1.5 hover:cursor-pointer"
                >
                  <LogOut size={11} className="sm:w-3 sm:h-3" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleTryDemo}
                  className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 sm:px-5 sm:py-2.5 text-[10px] sm:text-xs font-semibold text-amber-300 backdrop-blur-md transition-all duration-300 hover:border-amber-400/60 hover:bg-amber-500/20 hover:text-amber-200 hover:scale-[1.03] active:scale-[0.98] flex items-center gap-1 sm:gap-1.5 hover:cursor-pointer"
                >
                  <Compass size={11} className="text-amber-400 sm:w-3 sm:h-3" />
                  <span>Try Demo</span>
                </button>
                <Link href="/auth">
                  <button className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 sm:px-5 sm:py-2.5 text-[10px] sm:text-xs font-semibold text-white backdrop-blur-md transition-all duration-300 hover:border-red-700/30 hover:bg-white/12 hover:scale-[1.03] active:scale-[0.98] flex items-center gap-1 sm:gap-1.5 hover:cursor-pointer">
                    <KeyRound size={11} className="sm:w-3 sm:h-3" />
                    <span>Sign In</span>
                  </button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Content - Perfectly centered within 100vh with correct padding */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-28 pb-12 text-center">
        
        {/* Small Decorative Line */}
        <div className="mb-6 flex items-center gap-4">
          <div className="h-[1px] w-20 bg-red-400/40" />
          <div className="h-3 w-3 rotate-45 border border-red-400" />
          <div className="h-[1px] w-20 bg-red-400/40" />
        </div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="max-w-4xl bg-gradient-to-b from-white via-red-100 to-zinc-400 bg-clip-text text-6xl font-bold leading-tight text-transparent drop-shadow-[0_0_25px_rgba(255,255,255,0.15)] md:text-8xl font-cinzel select-none relative"
        >
          Turn Your Ambitions
          <br />
          <span className="relative inline-block mt-2">
            <span className="animate-shimmer bg-gradient-to-r from-[#fca5a5] via-[#f97316] via-[#ef4444] to-[#fca5a5] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(220,38,38,0.4)]">
              Into Legends
            </span>
            
            
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 max-w-xl text-2xl leading-relaxed text-zinc-200 font-semibold tracking-wide"
        >
          Type a goal.{' '}
          <span className="text-orange-400">The agent forges your legend.</span>
        </motion.p>

        {/* CTA Button */}
        <Link href={user ? "/dashboard" : "/auth"}>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="group relative mt-12 overflow-hidden rounded-full border border-amber-400/30 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-500 px-14 py-5 text-2xl font-semibold text-white shadow-2xl backdrop-blur-xl shadow-[0_0_60px_rgba(245,158,11,0.35)] hover:shadow-[0_0_80px_rgba(245,158,11,0.55)] transition-all duration-300 hover:cursor-pointer"
          >
            <span className="relative z-10 flex items-center gap-4">
              {user ? 'Enter Console' : 'Begin Journey'}
              <span className="transition group-hover:translate-x-1">
                →
              </span>
            </span>

            <div className="absolute inset-0 bg-white/10 opacity-0 transition group-hover:opacity-100" />
          </motion.button>
        </Link>

        {/* Bottom Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-10 text-lg italic text-zinc-400"
        >
          Every dream has a world waiting for you.
        </motion.p>
        {/* Scroll Hint — inline so it sits above the fade */}
        <motion.div
          className="mt-12 flex flex-col items-center gap-0.5 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0], y: [0, 8, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600 -mt-3">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 h-64 w-full bg-gradient-to-t from-black via-black/85 to-transparent pointer-events-none" />
    </section>
  )
}