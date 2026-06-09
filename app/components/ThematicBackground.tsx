'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface ThematicBackgroundProps {
  theme: 'fantasy' | 'cyberpunk' | 'steampunk'
}

export default function ThematicBackground({ theme }: ThematicBackgroundProps) {
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatches for random offsets
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="absolute inset-0 -z-30 overflow-hidden pointer-events-none select-none">
      {/* ─────────────────── AETHER FANTASY THEME ─────────────────── */}
      {theme === 'fantasy' && (
        <>
          {/* Constellation Stars */}
          <div className="absolute inset-0">
            {Array.from({ length: 24 }).map((_, i) => {
              const size = Math.random() * 2 + 1
              const top = Math.random() * 100
              const left = Math.random() * 100
              const delay = Math.random() * 8
              const duration = 4 + Math.random() * 6

              return (
                <div
                  key={`star-${i}`}
                  className="absolute bg-amber-100 rounded-full opacity-50 blur-[0.5px]"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    top: `${top}%`,
                    left: `${left}%`,
                    boxShadow: '0 0 8px rgba(245, 158, 11, 0.7)',
                    animation: `pulse-soft ${duration}s ease-in-out infinite`,
                    animationDelay: `${delay}s`,
                  }}
                />
              );
            })}
          </div>

          {/* Floating Aether Dust */}
          <div className="absolute inset-0">
            {Array.from({ length: 15 }).map((_, i) => {
              const size = Math.random() * 4 + 2
              const left = Math.random() * 100
              const bottom = -5
              const delay = Math.random() * 15
              const duration = 12 + Math.random() * 12

              return (
                <div
                  key={`dust-${i}`}
                  className="absolute rounded-full bg-[#7B4FCC]/20 blur-[1px] animate-stardust"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    left: `${left}%`,
                    bottom: `${bottom}%`,
                    boxShadow: '0 0 10px rgba(123, 79, 204, 0.5)',
                    animationDelay: `${delay}s`,
                    animationDuration: `${duration}s`,
                  }}
                />
              )
            })}
          </div>

          {/* Magical Runic Astrological Circle (Center-left) */}
          <div className="absolute left-[5%] top-[15%] w-[400px] h-[400px] opacity-10 animate-spin-slow pointer-events-none">
            <svg viewBox="0 0 200 200" className="w-full h-full text-amber-500 stroke-current fill-none stroke-[0.75]">
              <circle cx="100" cy="100" r="95" strokeDasharray="5,5" />
              <circle cx="100" cy="100" r="80" />
              <circle cx="100" cy="100" r="70" strokeDasharray="10,4" />
              <polygon points="100,20 180,140 20,140" />
              <polygon points="100,180 180,60 20,60" />
              <circle cx="100" cy="100" r="30" />
              {/* Inner details */}
              <line x1="100" y1="5" x2="100" y2="195" />
              <line x1="5" y1="100" x2="195" y2="100" />
            </svg>
          </div>

          {/* Another runic circle (Bottom-right) */}
          <div className="absolute right-[5%] bottom-[10%] w-[300px] h-[300px] opacity-10 animate-spin-slow-reverse pointer-events-none">
            <svg viewBox="0 0 200 200" className="w-full h-full text-[#7B4FCC] stroke-current fill-none stroke-[0.75]">
              <circle cx="100" cy="100" r="90" />
              <circle cx="100" cy="100" r="75" strokeDasharray="6,3" />
              <rect x="40" y="40" width="120" height="120" transform="rotate(45 100 100)" />
              <rect x="45" y="45" width="110" height="110" />
              <circle cx="100" cy="100" r="40" />
            </svg>
          </div>
        </>
      )}

      {/* ─────────────────── NEON CYBERPUNK THEME ─────────────────── */}
      {theme === 'cyberpunk' && (
        <>
          {/* Cyberpunk Tech Scanline */}
          <div className="absolute inset-x-0 h-[2px] bg-cyan-500/10 blur-[1px] animate-scanline top-0" />

          {/* Matrix Binary Streams */}
          <div className="absolute inset-0 flex justify-around opacity-[0.08]">
            {Array.from({ length: 12 }).map((_, i) => {
              const delay = Math.random() * 8
              const duration = 10 + Math.random() * 10
              const characters = ['0', '1', 'F', 'X', 'Ø', 'System', 'Core', 'Data', '101', 'Error']
              const randomString = Array.from({ length: 15 }).map(() => characters[Math.floor(Math.random() * characters.length)]).join(' ')

              return (
                <div
                  key={`stream-${i}`}
                  className="text-[9px] font-mono text-cyan-400 leading-none writing-vertical select-none animate-matrix-stream whitespace-nowrap"
                  style={{
                    animationDelay: `${delay}s`,
                    animationDuration: `${duration}s`,
                    writingMode: 'vertical-rl',
                    textOrientation: 'upright',
                  }}
                >
                  {randomString}
                </div>
              )
            })}
          </div>

          {/* Hexagonal Grid blueprint overlay */}
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,transparent_20%,#000_90%)]"
               style={{
                 backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='104' viewBox='0 0 60 104' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 17.3v34.6L30 69.3 0 52V17.3L30 0zm0 104l30-17.3v-34.6L30 34.7 0 52v34.6l30 17.3z' fill='%2306b6d4' fill-opacity='0.5' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                 backgroundSize: '60px 104px',
               }}
          />

          {/* Perspective grid projection at the bottom */}
          <div className="absolute bottom-0 left-0 w-full h-[30%] bg-[linear-gradient(to_bottom,transparent,rgba(6,182,212,0.08))] opacity-40 overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.15)_1px,transparent_1px)] bg-[size:50px_50px]"
                 style={{
                   transform: 'perspective(500px) rotateX(75deg) translateY(-50px) scale(2)',
                   transformOrigin: 'top center',
                 }}
            />
          </div>
        </>
      )}

      {/* ─────────────────── STEAMPUNK THEME ─────────────────── */}
      {theme === 'steampunk' && (
        <>
          {/* Rising Steam Furnace Embers */}
          <div className="absolute inset-0">
            {Array.from({ length: 22 }).map((_, i) => {
              const size = Math.random() * 3 + 2
              const left = Math.random() * 100
              const delay = Math.random() * 12
              const duration = 8 + Math.random() * 8

              return (
                <div
                  key={`ember-${i}`}
                  className="absolute rounded-full bg-amber-500/25 blur-[0.5px]"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    left: `${left}%`,
                    bottom: `-2%`,
                    boxShadow: '0 0 8px rgba(245, 158, 11, 0.6)',
                    animation: `float-ember-${(i % 3) + 1} ${duration}s ease-in-out infinite`,
                    animationDelay: `${delay}s`,
                  }}
                />
              )
            })}
          </div>

          {/* Blueprint drafting grid background */}
          <div className="absolute inset-0 opacity-[0.035]"
               style={{
                 backgroundImage: `linear-gradient(to right, #f59e0b 1px, transparent 1px), linear-gradient(to bottom, #f59e0b 1px, transparent 1px)`,
                 backgroundSize: '80px 80px',
               }}
          />

          {/* Floating Clockwork Mechanical Gears */}
          {/* Gear 1 - Big rotating counterclockwise (Top Left) */}
          <div className="absolute -left-[100px] top-[10%] w-[320px] h-[320px] opacity-[0.06] animate-spin-slow-reverse text-amber-500">
            <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current stroke-[1.5]">
              <circle cx="50" cy="50" r="30" />
              <circle cx="50" cy="50" r="10" />
              {/* Outer Gear Teeth */}
              {Array.from({ length: 16 }).map((_, i) => (
                <path
                  key={`tooth-1-${i}`}
                  d="M 50 10 L 47 16 L 53 16 Z"
                  transform={`rotate(${i * 22.5} 50 50)`}
                  className="fill-current"
                />
              ))}
              {/* Inner Spokes */}
              {Array.from({ length: 6 }).map((_, i) => (
                <line
                  key={`spoke-1-${i}`}
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="15"
                  transform={`rotate(${i * 60} 50 50)`}
                />
              ))}
            </svg>
          </div>

          {/* Gear 2 - Medium rotating clockwise (Top Right) */}
          <div className="absolute right-[2%] top-[5%] w-[180px] h-[180px] opacity-[0.05] animate-spin-slow text-orange-400">
            <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current stroke-[2]">
              <circle cx="50" cy="50" r="32" />
              <circle cx="50" cy="50" r="8" />
              {/* Gear Teeth */}
              {Array.from({ length: 12 }).map((_, i) => (
                <rect
                  key={`tooth-2-${i}`}
                  x="46"
                  y="8"
                  width="8"
                  height="10"
                  transform={`rotate(${i * 30} 50 50)`}
                  className="fill-current"
                />
              ))}
              {/* Spokes */}
              {Array.from({ length: 4 }).map((_, i) => (
                <line
                  key={`spoke-2-${i}`}
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="18"
                  transform={`rotate(${i * 90} 50 50)`}
                />
              ))}
            </svg>
          </div>

          {/* Gear 3 - Interlocking with Gear 2 (Further Right) */}
          <div className="absolute right-[calc(2%+130px)] top-[calc(5%+80px)] w-[110px] h-[110px] opacity-[0.04] animate-spin-slow-reverse text-yellow-600">
            <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current stroke-[2.5]">
              <circle cx="50" cy="50" r="30" />
              <circle cx="50" cy="50" r="6" />
              {/* Teeth */}
              {Array.from({ length: 10 }).map((_, i) => (
                <rect
                  key={`tooth-3-${i}`}
                  x="47"
                  y="10"
                  width="6"
                  height="8"
                  transform={`rotate(${i * 36 + 18} 50 50)`}
                  className="fill-current"
                />
              ))}
              {/* Spokes */}
              {Array.from({ length: 3 }).map((_, i) => (
                <line
                  key={`spoke-3-${i}`}
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="20"
                  transform={`rotate(${i * 120} 50 50)`}
                />
              ))}
            </svg>
          </div>
        </>
      )}
    </div>
  )
}
