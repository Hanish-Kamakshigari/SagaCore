'use client'

import { useEffect, useState } from 'react'

export function usePersistentState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(initialValue)

  // 1. Hydrate state from localStorage on mount
  useEffect(() => {
    try {
      const localData = localStorage.getItem(`sagacore_${key}`)
      if (localData) {
        setState(JSON.parse(localData))
      }
    } catch (e) {
      console.warn(`localStorage hydration failed for key "${key}":`, e)
    }
  }, [key])

  // 2. Wrap state updates to save to localStorage
  const setPersistedState = (value: T | ((val: T) => T)) => {
    setState((prev) => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value
      try {
        localStorage.setItem(`sagacore_${key}`, JSON.stringify(next))
      } catch (e) {
        console.error(`localStorage save failed for key "${key}":`, e)
      }
      return next
    })
  }

  return [state, setPersistedState] as const
}
