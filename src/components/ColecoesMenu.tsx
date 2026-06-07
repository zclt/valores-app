import { useState } from 'react'
import type { Colecao } from '../hooks/useColecoes'
import type { ValoresData } from '../hooks/useValoresData'
import './ColecoesMenu.css'

interface Props {
  colecoes: Colecao[]
  activeColecaoId: string | null
  onSave: (name: string) => Promise<void>
  onLoad: (c: Colecao) => void
  onRemove: (id: string) => void
  onRename: (id: string, name: string) => void
  onClose: () => void
}

const fmtDate = (d: Date) =>
  d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })

export default function ColecoesMenu({ colecoes, activeColecaoId, onSave, onLoad, onRemove, onRename, onClose }: Props) {
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleSave = async () => {
    const name = newName.trim()
    if (!name) return
    setSaving(true)
    try {
      await onSave(name)
      setNewName('')
    } finally {
      setSaving(false)
    }
  }

  const startRename = (c: Colecao) => {
    setEditingId(c.id)
    setEditingName(c.name)
  }

  const commitRename = (id: string) => {
    const name = editingName.trim()
    if (name) onRename(id, name)
    setEditingId(null)
  }

  return (
    <div className="colecoes-overlay" onClick={onClose}>
      <div className="colecoes-panel" onClick={e => e.stopPropagation()}>
        <div className="colecoes-header">
          <span className="colecoes-title">Coleções</span>
          <button className="colecoes-close" onClick={onClose}>✕</button>
        </div>

        <div className="colecoes-save-row">
          <input
            className="colecoes-input"
            placeholder="Nome da coleção…"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
          />
          <button
            className="colecoes-btn-save"
            onClick={handleSave}
            disabled={saving || !newName.trim()}
          >
            {saving ? '…' : 'Salvar atual'}
          </button>
        </div>

        {colecoes.length === 0 ? (
          <p className="colecoes-empty">Nenhuma coleção salva</p>
        ) : (
          <ul className="colecoes-list">
            {colecoes.map(c => {
              const isActive = c.id === activeColecaoId
              return (
              <li key={c.id} className={`colecao-item${isActive ? ' colecao-ativa' : ''}`}>
                <div className="colecao-info">
                  {editingId === c.id ? (
                    <input
                      className="colecao-rename-input"
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onBlur={() => commitRename(c.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitRename(c.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      autoFocus
                    />
                  ) : (
                    <button className="colecao-name" onClick={() => startRename(c)} title="Clique para renomear">
                      {c.name}
                    </button>
                  )}
                  <span className="colecao-date">
                    {isActive && <span className="colecao-badge-ativa">ativo</span>}
                    {fmtDate(c.savedAt)}
                  </span>
                </div>
                <div className="colecao-actions">
                  {!isActive && (
                  <button
                    className="colecao-btn-load"
                    onClick={() => { onLoad(c); onClose() }}
                    title="Carregar"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Carregar
                  </button>
                  )}
                  <button
                    className="colecao-btn-remove"
                    onClick={() => onRemove(c.id)}
                    title="Remover"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                </div>
              </li>
            )})}
          </ul>
        )}
      </div>
    </div>
  )
}
