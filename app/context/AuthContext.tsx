'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../lib/firebase'

export interface UserSession {
  uid: string
  email: string | null
}

interface AuthContextType {
  user: UserSession | null
  loading: boolean
  isMock: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
  loginAsGuest: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const setSessionCookie = (token: string | null) => {
  if (typeof window === 'undefined') return
  if (token) {
    document.cookie = `sagacore_session_token=${token}; path=/; max-age=3600; SameSite=Strict; Secure`
  } else {
    document.cookie = 'sagacore_session_token=; path=/; max-age=0'
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const clearError = () => setError(null)

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      // 1. Real Firebase Auth Observer
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
          })
          try {
            const token = await firebaseUser.getIdToken()
            setSessionCookie(token)
          } catch (e) {
            console.error('Failed to get Firebase token:', e)
          }
        } else {
          setUser(null)
          setSessionCookie(null)
        }
        setLoading(false)
      })
      return () => unsubscribe()
    } else {
      // 2. Mock Auth Initialization
      try {
        const cachedSession = localStorage.getItem('sagacore_mock_session')
        if (cachedSession) {
          const parsed = JSON.parse(cachedSession)
          setUser(parsed)
          setSessionCookie(parsed.uid)
        }
      } catch (e) {
        console.error('Failed to parse mock session:', e)
      } finally {
        setLoading(false)
      }
    }
  }, [])

  // Firebase Email/Password Sign-In
  const login = async (email: string, password: string) => {
    setError(null)
    if (isFirebaseConfigured && auth) {
      try {
        const credential = await signInWithEmailAndPassword(auth, email, password)
        if (credential.user) {
          setUser({
            uid: credential.user.uid,
            email: credential.user.email,
          })
        }
      } catch (err: any) {
        let msg = 'Authentication failed.'
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          msg = 'Invalid email or password.'
        } else if (err.code === 'auth/invalid-email') {
          msg = 'Invalid email format.'
        }
        setError(msg)
        throw new Error(msg)
      }
    } else {
      // Mock Login Implementation
      const mockUsers = JSON.parse(localStorage.getItem('sagacore_mock_users') || '{}')
      if (mockUsers[email] && mockUsers[email] === password) {
        // Generate a deterministic mock UID
        const mockUid = `mock_user_${Buffer.from(email).toString('hex').slice(0, 12)}`
        const mockSession = { uid: mockUid, email }
        setUser(mockSession)
        localStorage.setItem('sagacore_mock_session', JSON.stringify(mockSession))
        setSessionCookie(mockUid)
      } else {
        const msg = 'Invalid email or password.'
        setError(msg)
        throw new Error(msg)
      }
    }
  }

  // Firebase Email/Password Registration
  const register = async (email: string, password: string) => {
    setError(null)
    if (isFirebaseConfigured && auth) {
      try {
        const credential = await createUserWithEmailAndPassword(auth, email, password)
        if (credential.user) {
          setUser({
            uid: credential.user.uid,
            email: credential.user.email,
          })
        }
      } catch (err: any) {
        let msg = 'Registration failed.'
        if (err.code === 'auth/email-already-in-use') {
          msg = 'This email address is already in use.'
        } else if (err.code === 'auth/weak-password') {
          msg = 'Password should be at least 6 characters.'
        } else if (err.code === 'auth/invalid-email') {
          msg = 'Invalid email format.'
        }
        setError(msg)
        throw new Error(msg)
      }
    } else {
      // Mock Registration Implementation
      const mockUsers = JSON.parse(localStorage.getItem('sagacore_mock_users') || '{}')
      if (mockUsers[email]) {
        const msg = 'This email address is already in use.'
        setError(msg)
        throw new Error(msg)
      } else {
        mockUsers[email] = password
        localStorage.setItem('sagacore_mock_users', JSON.stringify(mockUsers))

        const mockUid = `mock_user_${Buffer.from(email).toString('hex').slice(0, 12)}`
        const mockSession = { uid: mockUid, email }
        setUser(mockSession)
        localStorage.setItem('sagacore_mock_session', JSON.stringify(mockSession))
        setSessionCookie(mockUid)
      }
    }
  }

  // Firebase Sign-Out
  const logout = async () => {
    setError(null)
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth)
        setUser(null)
        setSessionCookie(null)
      } catch (err: any) {
        console.error('Sign out error:', err)
      }
    } else {
      // Mock Sign-Out
      setUser(null)
      localStorage.removeItem('sagacore_mock_session')
      setSessionCookie(null)
    }
  }

  // Guest Sign-In (Demo Mode)
  const loginAsGuest = async () => {
    setError(null)
    
    // Check if we already have a cached guest UID to keep progress stable
    let guestUid = localStorage.getItem('sagacore_guest_uid')
    const hadGuestUid = guestUid !== null
    if (!guestUid) {
      guestUid = `guest_${Math.random().toString(36).substring(2, 11)}`
      localStorage.setItem('sagacore_guest_uid', guestUid)
    }

    // Generate a random fantasy/cyberpunk/steampunk name for this guest session
    let guestName = localStorage.getItem('sagacore_guest_name')
    if (!guestName) {
      const prefixes = ['Aether', 'Neon', 'Steam', 'Shadow', 'Clockwork', 'Vector', 'Cyber', 'Runic', 'Cobalt', 'Amber', 'Glitch', 'Chrono', 'Void', 'Solar', 'Quantum'];
      const suffixes = ['Scribe', 'Mage', 'Netrunner', 'Alchemist', 'Architect', 'Sentinel', 'Operator', 'Rider', 'Forger', 'Weaver', 'Hacker', 'Nomad', 'Mechanic', 'Ranger', 'Knight'];
      const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      const randomNum = Math.floor(100 + Math.random() * 900);
      guestName = `${randomPrefix} ${randomSuffix} #${randomNum}`;
      localStorage.setItem('sagacore_guest_name', guestName);
    }

    const guestSession = { uid: guestUid, email: `${guestUid}@sagacore.demo` }

    // Pre-cache display name in local storage for page.tsx hydration
    localStorage.setItem(`sagacore_${guestUid}_displayName`, guestName)

    // Clear old guest progress ONLY if this is the very first time initializing guestUid
    if (!hadGuestUid) {
      try {
        localStorage.removeItem(`sagacore_${guestUid}_activeWorld`)
        localStorage.removeItem(`sagacore_${guestUid}_quests`)
        localStorage.removeItem(`sagacore_${guestUid}_xp`)
        localStorage.removeItem(`sagacore_${guestUid}_level`)
        localStorage.removeItem(`sagacore_${guestUid}_chapters`)
        localStorage.removeItem(`sagacore_${guestUid}_lore`)
        localStorage.removeItem(`sagacore_${guestUid}_audioActive`)
      } catch (e) {
        console.warn('Failed to clear old guest session cache:', e)
      }
    }

    setUser(guestSession)
    localStorage.setItem('sagacore_mock_session', JSON.stringify(guestSession))
    setSessionCookie(guestUid)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isMock: !isFirebaseConfigured,
        error,
        login,
        register,
        logout,
        clearError,
        loginAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
