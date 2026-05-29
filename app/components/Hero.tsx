'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Hero() {
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
          backgroundImage: "url('/image.jpg')",
        }}
      />

      {/* Star Particles Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(1.5px_1.5px_at_10%_20%,#fff_100%,transparent),radial-gradient(2px_2px_at_30%_50%,#fff_100%,transparent),radial-gradient(1.5px_1.5px_at_50%_40%,#fff_100%,transparent),radial-gradient(2.5px_2.5px_at_70%_80%,#fff_100%,transparent),radial-gradient(1.5px_1.5px_at_80%_15%,#fff_100%,transparent),radial-gradient(2px_2px_at_90%_60%,#fff_100%,transparent)] bg-[size:250px_250px] opacity-20 pointer-events-none" />

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
          <Link href="/dashboard">
            <button className="rounded-full border border-white/15 bg-white/5 px-6 py-2.5 text-xs font-semibold text-white backdrop-blur-md transition-all duration-300 hover:border-purple-500/30 hover:bg-white/12 hover:scale-[1.03] active:scale-[0.98]">
              Console
            </button>
          </Link>
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
          className="max-w-4xl bg-gradient-to-b from-white via-purple-100 to-pink-300 bg-clip-text text-6xl font-bold leading-tight text-transparent drop-shadow-[0_0_25px_rgba(255,255,255,0.25)] md:text-8xl font-cinzel"
        >
          Turn Your Ambitions
          <br />
          Into Legends
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
        <Link href="/dashboard">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="group relative mt-12 overflow-hidden rounded-full border border-white/20 bg-gradient-to-r from-indigo-500/80 via-purple-500/80 to-pink-500/80 px-12 py-4.5 text-xl font-semibold text-white shadow-2xl backdrop-blur-xl shadow-[0_0_60px_rgba(217,70,239,0.35)] hover:shadow-[0_0_80px_rgba(217,70,239,0.5)] transition-all duration-300"
          >
            <span className="relative z-10 flex items-center gap-4">
              Begin Journey
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