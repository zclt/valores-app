import { useState, useEffect } from 'react'
import { type User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  const login = async () => {
    setLoginLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
    } finally {
      setLoginLoading(false)
    }
  }

  const logout = () => signOut(auth)

  return { user, loading, loginLoading, login, logout }
}
