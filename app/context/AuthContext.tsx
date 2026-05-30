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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const clearError = () => setError(null)

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      // 1. Real Firebase Auth Observer
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
          })
        } else {
          setUser(null)
        }
        setLoading(false)
      })
      return () => unsubscribe()
    } else {
      // 2. Mock Auth Initialization
      try {
        const cachedSession = localStorage.getItem('sagacore_mock_session')
        if (cachedSession) {
          setUser(JSON.parse(cachedSession))
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
      } catch (err: any) {
        console.error('Sign out error:', err)
      }
    } else {
      // Mock Sign-Out
      setUser(null)
      localStorage.removeItem('sagacore_mock_session')
    }
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
