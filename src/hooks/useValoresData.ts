import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export interface ValoresData {
  textSaida: string
  textEntrada: string
}

const STORAGE_KEY = 'valores-app-data'

function loadLocal(): ValoresData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { textSaida: '', textEntrada: '' }
  } catch {
    return { textSaida: '', textEntrada: '' }
  }
}

export function useValoresData(uid: string | null) {
  const [data, setData] = useState<ValoresData>(loadLocal)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!uid) return
    setLoading(true)
    const ref = doc(db, 'users', uid, 'data', 'valores')
    getDoc(ref)
      .then(snap => {
        if (snap.exists()) {
          const remote = snap.data() as ValoresData
          setData(remote)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remote))
        }
      })
      .finally(() => setLoading(false))
  }, [uid])

  const save = async (next: ValoresData) => {
    setData(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    if (uid) {
      const ref = doc(db, 'users', uid, 'data', 'valores')
      await setDoc(ref, { ...next, updatedAt: serverTimestamp() })
    }
  }

  return { data, loading, save }
}
