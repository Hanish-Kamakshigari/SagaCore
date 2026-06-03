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
      {/* ─── Premium Custom CSS Keyframe Animations for Aether Particle Drift ─── */}
      <style jsx global>{`
        @keyframes text-shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes aether-particle {
          0% { transform: translate(0px, 0px) scale(0.5) rotate(0deg); opacity: 0; }
          25% { opacity: 0.75; }
          75% { opacity: 0.75; }
          100% { transform: translate(var(--dx, 20px), var(--dy, -50px)) scale(1.1) rotate(180deg); opacity: 0; }
        }
        .animate-shimmer {
          background-size: 200% auto;
          animation: text-shimmer 6s linear infinite;
        }
        .animate-aether-1 { animation: aether-particle 8s ease-in-out infinite; --dx: 45px; --dy: -75px; }
        .animate-aether-2 { animation: aether-particle 10s ease-in-out infinite 2s; --dx: -35px; --dy: -65px; }
        .animate-aether-3 { animation: aether-particle 7s ease-in-out infinite 1s; --dx: 25px; --dy: -85px; }
        .animate-aether-4 { animation: aether-particle 9s ease-in-out infinite 3s; --dx: -50px; --dy: -55px; }
      `}</style>
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
          backgroundImage: "url('/image.jpg')",
        }}
      />

      {/* Star Particles Overlay removed for visual simplicity */}

      {/* Multi-layer premium overlay - darker at the top to pop the navbar, open in the middle for background visibility, dark at the bottom to transition */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/90 pointer-events-none" />

      {/* Soft color glow matching the ambient aesthetic */}
      <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/15 blur-[120px] pointer-events-none" />

      {/* Floating Navbar - integrated smoothly with absolute positioning */}
      <header className="absolute top-6 left-1/2 z-50 w-[92%] max-w-6xl -translate-x-1/2 pointer-events-auto">
        <nav className="flex items-center justify-between rounded-full border border-white/10 bg-black/35 px-8 py-3.5 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-purple-500/20">
          {/* Logo / Brand */}
          <Link href="/" className="flex flex-col items-start select-none group">
            <span className="text-xl font-black tracking-[0.2em] text-white font-cinzel bg-gradient-to-r from-white via-purple-100 to-indigo-200 bg-clip-text text-transparent group-hover:from-white group-hover:via-purple-200 group-hover:to-purple-300 transition-all duration-300">
              SAGACORE HUB
            </span>
            <span className="text-[8px] uppercase tracking-[0.3em] text-purple-400 font-bold font-mono -mt-0.5 pl-0.5 group-hover:text-purple-300 transition-colors duration-300">
              World Engine
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden items-center gap-8 text-sm font-medium text-zinc-300 md:flex">
            {['Home', 'Features', 'About', 'Roadmap'].map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                className="relative py-1 transition-colors duration-200 hover:text-white after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-purple-400 after:transition-all after:duration-300 hover:after:w-full"
              >
                {link}
              </a>
            ))}
          </div>

          {/* CTA / Console */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard">
                  <button className="rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2.5 text-xs font-semibold text-purple-300 backdrop-blur-md transition-all duration-300 hover:border-purple-500/50 hover:bg-purple-500/20 hover:scale-[1.03] active:scale-[0.98] flex items-center gap-1.5 hover:cursor-pointer">
                    <LayoutDashboard size={12} />
                    <span>Console</span>
                  </button>
                </Link>
                <button
                  onClick={() => logout()}
                  className="rounded-full border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-xs font-semibold text-red-400 backdrop-blur-md transition-all duration-300 hover:bg-red-500/10 hover:scale-[1.03] active:scale-[0.98] flex items-center gap-1.5 hover:cursor-pointer"
                >
                  <LogOut size={12} />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleTryDemo}
                  className="rounded-full border border-purple-500/30 bg-purple-500/5 px-5 py-2.5 text-xs font-semibold text-purple-300 backdrop-blur-md transition-all duration-300 hover:border-pink-500/40 hover:bg-purple-500/10 hover:text-pink-300 hover:scale-[1.03] active:scale-[0.98] flex items-center gap-1.5 hover:cursor-pointer"
                >
                  <Compass size={12} className="text-purple-400" />
                  <span>Try Demo</span>
                </button>
                <Link href="/auth">
                  <button className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-semibold text-white backdrop-blur-md transition-all duration-300 hover:border-purple-500/30 hover:bg-white/12 hover:scale-[1.03] active:scale-[0.98] flex items-center gap-1.5 hover:cursor-pointer">
                    <KeyRound size={12} />
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
          <div className="h-[1px] w-20 bg-purple-300/40" />
          <div className="h-3 w-3 rotate-45 border border-purple-300" />
          <div className="h-[1px] w-20 bg-purple-300/40" />
        </div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="max-w-4xl bg-gradient-to-b from-white via-purple-100 to-zinc-400 bg-clip-text text-6xl font-bold leading-tight text-transparent drop-shadow-[0_0_25px_rgba(255,255,255,0.15)] md:text-8xl font-cinzel select-none relative"
        >
          Turn Your Ambitions
          <br />
          <span className="relative inline-block mt-2">
            <span className="animate-shimmer bg-gradient-to-r from-[#d8b4fe] via-[#f472b6] via-[#67e8f9] to-[#d8b4fe] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(168,85,247,0.3)]">
              Into Legends
            </span>
            
            {/* Drifting fantasy aether sparkles */}
            <span className="absolute -top-3 left-[20%] text-purple-300 pointer-events-none opacity-0 animate-aether-1 z-20">
              <Sparkles size={18} className="animate-pulse" />
            </span>
            <span className="absolute -top-1 left-[70%] text-cyan-300 pointer-events-none opacity-0 animate-aether-2 z-20">
              <Sparkle size={14} />
            </span>
            <span className="absolute top-8 left-[5%] text-pink-300 pointer-events-none opacity-0 animate-aether-3 z-20">
              <Sparkle size={16} className="animate-pulse" />
            </span>
            <span className="absolute top-10 left-[85%] text-purple-400 pointer-events-none opacity-0 animate-aether-4 z-20">
              <Sparkles size={15} />
            </span>
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 max-w-3xl text-xl leading-relaxed text-zinc-300"
        >
          Forge ambitions into evolving legendary realms powered by adaptive AI intelligence.
        </motion.p>

        {/* CTA Button */}
        <Link href={user ? "/dashboard" : "/auth"}>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="group relative mt-12 overflow-hidden rounded-full border border-white/20 bg-gradient-to-r from-indigo-500/80 via-purple-500/80 to-pink-500/80 px-12 py-4.5 text-xl font-semibold text-white shadow-2xl backdrop-blur-xl shadow-[0_0_60px_rgba(217,70,239,0.35)] hover:shadow-[0_0_80px_rgba(217,70,239,0.5)] transition-all duration-300 hover:cursor-pointer"
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
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 h-64 w-full bg-gradient-to-t from-black via-black/85 to-transparent pointer-events-none" />
    </section>
  )
}