import { useState, useEffect, useRef } from 'react'
import ValoresInput from './components/ValoresInput'
import ValorCard from './components/ValorCard'
import ValoresChart from './components/ValoresChart'
import ShareMenu from './components/ShareMenu'
import ColecoesMenu from './components/ColecoesMenu'
import CompararModal from './components/CompararModal'
import LoginScreen from './components/LoginScreen'
import { generateShareImage } from './utils/shareImage'
import { parseValores, randomColor } from './utils/parseValores'
import { useAuth } from './hooks/useAuth'
import { useValoresData } from './hooks/useValoresData'
import { useColecoes } from './hooks/useColecoes'
import './App.css'

export type ValorType = 'saida' | 'entrada'

export interface Valor {
  id: string
  value: number
  description: string
  color: string
  type: ValorType
  done?: boolean
}

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export default function App() {
  const { user, loading: authLoading, loginLoading, login, logout } = useAuth()
  const { data, loading: dataLoading, save } = useValoresData(user?.uid ?? null)
  const { colecoes, saveColecao, updateColecao, removeColecao, renameColecao } = useColecoes(user?.uid ?? null)

  const [showInput, setShowInput] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showColecoes, setShowColecoes] = useState(false)
  const [showCompare, setShowCompare] = useState(false)
  const [shareLoading, setShareLoading] = useState<'image' | 'text' | null>(null)
  const [valores, setValores] = useState<Valor[]>([])
  const [activeColecaoId, setActiveColecaoId] = useState<string | null>(null)
  const initialColecaoLoaded = useRef(false)

  useEffect(() => {
    if (initialColecaoLoaded.current || colecoes.length === 0) return
    initialColecaoLoaded.current = true
    const most = colecoes[0]
    save({ textSaida: most.textSaida, textEntrada: most.textEntrada, doneKeys: most.doneKeys })
    setActiveColecaoId(most.id)
  }, [colecoes])

  useEffect(() => {
    setValores([
      ...parseValores(data.textSaida, 'saida'),
      ...parseValores(data.textEntrada, 'entrada'),
    ])
  }, [data.textSaida, data.textEntrada])

  useEffect(() => {
    const doneSet = new Set(data.doneKeys ?? [])
    setValores(prev => prev.map(v => ({ ...v, done: doneSet.has(`${v.type}:${v.description}:${v.value}`) })))
  }, [data.doneKeys])

  const handleApply = async (ts: string, te: string) => {
    const next = [...parseValores(ts, 'saida'), ...parseValores(te, 'entrada')]
    const nextKeys = new Set(next.map(v => `${v.type}:${v.description}:${v.value}`))
    const doneKeys = (data.doneKeys ?? []).filter(k => nextKeys.has(k))
    const updated = { textSaida: ts, textEntrada: te, doneKeys }
    await save(updated)
    if (activeColecaoId) {
      await updateColecao(activeColecaoId, updated)
    } else if (ts || te) {
      const id = await saveColecao('Sem nome', updated)
      if (id) setActiveColecaoId(id)
    }
    setShowInput(false)
  }

  const handleColorChange = (id: string) => {
    setValores(prev => prev.map(v => v.id === id ? { ...v, color: randomColor() } : v))
  }

  const handleToggleDone = (id: string) => {
    const updated = valores.map(v => v.id === id ? { ...v, done: !v.done } : v)
    setValores(updated)
    const doneKeys = updated.filter(v => v.done).map(v => `${v.type}:${v.description}:${v.value}`)
    const updatedData = { textSaida: data.textSaida, textEntrada: data.textEntrada, doneKeys }
    save(updatedData)
    if (activeColecaoId) updateColecao(activeColecaoId, updatedData)
  }

  const activeColecao = colecoes.find(c => c.id === activeColecaoId) ?? null

  const saidas = valores.filter(v => v.type === 'saida')
  const entradas = valores.filter(v => v.type === 'entrada')
  const totalSaidas = saidas.reduce((s, v) => s + v.value, 0)
  const totalEntradas = entradas.reduce((s, v) => s + v.value, 0)
  const saldo = totalEntradas - totalSaidas
  const hasValues = valores.length > 0

  const handleShareImage = async () => {
    setShareLoading('image')
    try {
      const blob = await generateShareImage(saidas, entradas, totalSaidas, totalEntradas)
      const file = new File([blob], 'valores.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Valores' })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'valores.png'
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch { /* cancelled */ } finally {
      setShareLoading(null)
      setShowShareMenu(false)
    }
  }

  const handleShareText = async () => {
    setShareLoading('text')
    try {
      const lines: string[] = ['-----------\n']
      if (saidas.length > 0) {
        lines.push('Saídas')
        saidas.forEach(v => lines.push(`${v.done ? '✓' : '•'} ${v.description}: ${fmt.format(v.value)}`))
        lines.push(`Total: ${fmt.format(totalSaidas)}\n`)
      }
      if (entradas.length > 0) {
        lines.push('Entradas')
        entradas.forEach(v => lines.push(`${v.done ? '✓' : '•'} ${v.description}: ${fmt.format(v.value)}`))
        lines.push(`Total: ${fmt.format(totalEntradas)}\n`)
      }
      lines.push(`Saldo: ${saldo >= 0 ? '+' : ''}${fmt.format(saldo)}`)
      const text = lines.join('\n')
      if (navigator.share) {
        await navigator.share({ text, title: 'Valores' })
      } else {
        await navigator.clipboard.writeText(text)
      }
    } catch { /* cancelled */ } finally {
      setShareLoading(null)
      setShowShareMenu(false)
    }
  }

  if (authLoading) return <div className="auth-loading" />

  if (!user) return <LoginScreen onLogin={login} loading={loginLoading} />

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="title-group">
            <h1 className="title">Valores</h1>
            {activeColecao && (
              <span className="colecao-nome">{activeColecao.name}</span>
            )}
          </div>
          {hasValues && (
            <span className={`saldo ${saldo >= 0 ? 'positivo' : 'negativo'}`}>
              {saldo >= 0 ? '+' : ''}{fmt.format(saldo)}
            </span>
          )}
        </div>
        <div className="header-actions">
          <button className="btn-icon" onClick={() => setShowColecoes(true)} title="Coleções">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          {colecoes.length >= 2 && (
            <button className="btn-icon" onClick={() => setShowCompare(true)} title="Comparar">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </button>
          )}
          {hasValues && (
            <button className="btn-icon" onClick={() => setShowShareMenu(true)} disabled={shareLoading !== null} title="Compartilhar">
              {shareLoading !== null
                ? <span className="spinner" />
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              }
            </button>
          )}
          <button className="btn-primary" onClick={() => setShowInput(true)} disabled={dataLoading}>
            {dataLoading ? '…' : hasValues ? '✎ Editar' : '+ Adicionar'}
          </button>
          <button className="btn-avatar" onClick={logout} title={`Sair (${user.displayName})`}>
            {user.photoURL
              ? <img src={user.photoURL} alt={user.displayName ?? ''} className="avatar-img" referrerPolicy="no-referrer" />
              : <span className="avatar-initial">{(user.displayName ?? user.email ?? '?')[0].toUpperCase()}</span>
            }
          </button>
        </div>
      </header>

      {!hasValues ? (
        <div className="empty">
          <div className="empty-icon">₿</div>
          <p>Nenhum valor cadastrado</p>
          <button className="btn-primary" onClick={() => setShowInput(true)}>
            + Adicionar
          </button>
        </div>
      ) : (
        <div className="columns">
          <div className="column">
            <div className="column-header saida-header">
              <span className="column-title">Saídas</span>
              <span className="column-total">{fmt.format(totalSaidas)}</span>
            </div>
            <div className="column-cards">
              {saidas.length === 0
                ? <p className="column-empty">Nenhuma saída</p>
                : saidas.map(v => (
                  <ValorCard key={v.id} valor={v} onColorChange={() => handleColorChange(v.id)} onToggleDone={() => handleToggleDone(v.id)} />
                ))
              }
            </div>
          </div>

          <div className="column">
            <div className="column-header entrada-header">
              <span className="column-title">Entradas</span>
              <span className="column-total">{fmt.format(totalEntradas)}</span>
            </div>
            <div className="column-cards">
              {entradas.length === 0
                ? <p className="column-empty">Nenhuma entrada</p>
                : entradas.map(v => (
                  <ValorCard key={v.id} valor={v} onColorChange={() => handleColorChange(v.id)} onToggleDone={() => handleToggleDone(v.id)} />
                ))
              }
            </div>
          </div>
        </div>
      )}

      {hasValues && (
        <ValoresChart
          saidas={saidas}
          entradas={entradas}
          totalSaidas={totalSaidas}
          totalEntradas={totalEntradas}
        />
      )}

      {showShareMenu && (
        <ShareMenu
          onImage={handleShareImage}
          onText={handleShareText}
          onClose={() => setShowShareMenu(false)}
          loading={shareLoading}
        />
      )}

      {showColecoes && (
        <ColecoesMenu
          colecoes={colecoes}
          activeColecaoId={activeColecaoId}
          onSave={async name => {
            const id = await saveColecao(name, data)
            if (id) setActiveColecaoId(id)
          }}
          onNewEmpty={async () => {
            const empty = { textSaida: '', textEntrada: '', doneKeys: [] }
            const id = await saveColecao('Sem nome', empty)
            if (id) {
              await save(empty)
              setActiveColecaoId(id)
            }
          }}
          onLoad={c => {
            save({ textSaida: c.textSaida, textEntrada: c.textEntrada, doneKeys: c.doneKeys })
            setActiveColecaoId(c.id)
          }}
          onRemove={id => {
            removeColecao(id)
            if (activeColecaoId === id) {
              const remaining = colecoes.filter(c => c.id !== id)
              if (remaining.length > 0) {
                const next = remaining[0]
                save({ textSaida: next.textSaida, textEntrada: next.textEntrada, doneKeys: next.doneKeys })
                setActiveColecaoId(next.id)
              } else {
                save({ textSaida: '', textEntrada: '', doneKeys: [] })
                setActiveColecaoId(null)
              }
            }
          }}
          onRename={renameColecao}
          onClose={() => setShowColecoes(false)}
        />
      )}

      {showCompare && (
        <CompararModal colecoes={colecoes} onClose={() => setShowCompare(false)} />
      )}

      {showInput && (
        <ValoresInput
          initialTextSaida={data.textSaida}
          initialTextEntrada={data.textEntrada}
          onApply={handleApply}
          onClose={() => setShowInput(false)}
        />
      )}
    </div>
  )
}
