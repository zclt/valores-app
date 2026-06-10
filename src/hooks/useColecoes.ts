import { useState, useEffect } from 'react'
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { ValoresData } from './useValoresData'

export interface Colecao {
  id: string
  name: string
  textSaida: string
  textEntrada: string
  doneKeys?: string[]
  savedAt: Date
}

export function useColecoes(uid: string | null) {
  const [colecoes, setColecoes] = useState<Colecao[]>([])

  useEffect(() => {
    if (!uid) { setColecoes([]); return }
    const ref = collection(db, 'users', uid, 'colecoes')
    return onSnapshot(ref, snap => {
      const docs = snap.docs.map(d => {
        const raw = d.data()
        return {
          id: d.id,
          name: raw.name,
          textSaida: raw.textSaida ?? '',
          textEntrada: raw.textEntrada ?? '',
          doneKeys: raw.doneKeys ?? [],
          savedAt: raw.savedAt?.toDate() ?? new Date(),
        }
      })
      docs.sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime())
      setColecoes(docs)
    }, err => console.error('colecoes snapshot error:', err))
  }, [uid])

  const saveColecao = async (name: string, data: ValoresData): Promise<string> => {
    if (!uid) return ''
    const ref = await addDoc(collection(db, 'users', uid, 'colecoes'), {
      name,
      textSaida: data.textSaida,
      textEntrada: data.textEntrada,
      doneKeys: data.doneKeys ?? [],
      savedAt: serverTimestamp(),
    })
    return ref.id
  }

  const updateColecao = async (id: string, data: ValoresData) => {
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'colecoes', id), {
      textSaida: data.textSaida,
      textEntrada: data.textEntrada,
      doneKeys: data.doneKeys ?? [],
    })
  }

  const removeColecao = async (id: string) => {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'colecoes', id))
  }

  const renameColecao = async (id: string, name: string) => {
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'colecoes', id), { name })
  }

  return { colecoes, saveColecao, updateColecao, removeColecao, renameColecao }
}
