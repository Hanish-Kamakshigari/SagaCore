'use client'

import { useEffect, useRef } from 'react'

export function useAmbientAudio(theme: 'fantasy' | 'cyberpunk' | 'steampunk', active: boolean) {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const oscRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  useEffect(() => {
    if (!active) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {})
        audioCtxRef.current = null
      }
      return
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      
      const ctx = new AudioCtx()
      audioCtxRef.current = ctx

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      const config = {
        fantasy: { freq: 110.00, wave: 'sine' as OscillatorType, volume: 0.08 },   // A2 low natural drone
        cyberpunk: { freq: 73.42, wave: 'sawtooth' as OscillatorType, volume: 0.03 }, // D2 raw neon low-buzz
        steampunk: { freq: 98.00, wave: 'triangle' as OscillatorType, volume: 0.06 }  // G2 mellow pressure drone
      }[theme] || { freq: 110.00, wave: 'sine' as OscillatorType, volume: 0.08 }

      osc.type = config.wave
      osc.frequency.setValueAtTime(config.freq, ctx.currentTime)

      // Apply a heavy lowpass filter to create a warm, deep ambient drone instead of harsh raw tones
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(180, ctx.currentTime)

      // Smooth volume fade-in to prevent pop
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(config.volume, ctx.currentTime + 1.5)

      // Connect nodes
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      
      osc.start()

      oscRef.current = osc
      gainRef.current = gain
    } catch (e) {
      console.warn('Web Audio Context initialization blocked or failed:', e)
    }

    return () => {
      // Smooth fade-out on cleanup
      if (gainRef.current && audioCtxRef.current) {
        try {
          const currentCtx = audioCtxRef.current
          const currentGain = gainRef.current
          const currentOsc = oscRef.current
          
          currentGain.gain.setValueAtTime(currentGain.gain.value, currentCtx.currentTime)
          currentGain.gain.linearRampToValueAtTime(0, currentCtx.currentTime + 0.5)
          
          setTimeout(() => {
            currentOsc?.stop()
            currentCtx.close().catch(() => {})
          }, 600)
        } catch {
          if (audioCtxRef.current) {
            audioCtxRef.current.close().catch(() => {})
          }
        }
      } else if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {})
      }
      
      audioCtxRef.current = null
      oscRef.current = null
      gainRef.current = null
    }
  }, [theme, active])
}
