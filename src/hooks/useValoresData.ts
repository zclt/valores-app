import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export interface ValoresData {
  textSaida: string
  textEntrada: string
  doneKeys?: string[]
}

const EMPTY: ValoresData = { textSaida: '', textEntrada: '' }
const storageKey = (uid: string) => `valores-app-data-${uid}`

export function useValoresData(uid: string | null) {
  const [data, setData] = useState<ValoresData>(EMPTY)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!uid) {
      setData(EMPTY)
      return
    }

    // Carrega cache local do usuário imediatamente (evita tela vazia)
    try {
      const cached = localStorage.getItem(storageKey(uid))
      if (cached) setData(JSON.parse(cached))
    } catch { /* ignore */ }

    // Sincroniza com Firestore
    setLoading(true)
    const ref = doc(db, 'users', uid, 'data', 'valores')
    getDoc(ref)
      .then(snap => {
        if (snap.exists()) {
          const remote = snap.data() as ValoresData
          setData(remote)
          localStorage.setItem(storageKey(uid), JSON.stringify(remote))
        }
      })
      .finally(() => setLoading(false))
  }, [uid])

  const save = async (next: ValoresData) => {
    setData(next)
    if (uid) {
      localStorage.setItem(storageKey(uid), JSON.stringify(next))
      const ref = doc(db, 'users', uid, 'data', 'valores')
      await setDoc(ref, { ...next, updatedAt: serverTimestamp() })
    }
  }

  return { data, loading, save }
}
