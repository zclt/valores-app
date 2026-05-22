import { useState, useEffect } from 'react'
import ValoresInput from './components/ValoresInput'
import ValorCard from './components/ValorCard'
import ValoresChart from './components/ValoresChart'
import ShareMenu from './components/ShareMenu'
import LoginScreen from './components/LoginScreen'
import { generateShareImage } from './utils/shareImage'
import { useAuth } from './hooks/useAuth'
import { useValoresData } from './hooks/useValoresData'
import './App.css'

export type ValorType = 'saida' | 'entrada'

export interface Valor {
  id: string
  value: number
  description: string
  color: string
  type: ValorType
}

export function randomColor(): string {
  const hue = Math.floor(Math.random() * 360)
  const sat = 65 + Math.floor(Math.random() * 20)
  const light = 45 + Math.floor(Math.random() * 12)
  return `hsl(${hue}, ${sat}%, ${light}%)`
}

function parseValores(text: string, type: ValorType): Valor[] {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .reduce<Valor[]>((acc, line) => {
      const match = line.match(/^([\d.,]+)\s+(.+)$/)
      if (!match) return acc
      const raw = match[1].replace(/\./g, '').replace(',', '.')
      const value = parseFloat(raw)
      if (isNaN(value)) return acc
      acc.push({ id: crypto.randomUUID(), value, description: match[2], color: randomColor(), type })
      return acc
    }, [])
    .sort((a, b) => b.value - a.value)
}

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export default function App() {
  const { user, loading: authLoading, loginLoading, login, logout } = useAuth()
  const { data, loading: dataLoading, save } = useValoresData(user?.uid ?? null)

  const [showInput, setShowInput] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [shareLoading, setShareLoading] = useState<'image' | 'text' | null>(null)
  const [valores, setValores] = useState<Valor[]>([])

  useEffect(() => {
    setValores([
      ...parseValores(data.textSaida, 'saida'),
      ...parseValores(data.textEntrada, 'entrada'),
    ])
  }, [data])

  const handleApply = async (ts: string, te: string) => {
    await save({ textSaida: ts, textEntrada: te })
    setShowInput(false)
  }

  const handleColorChange = (id: string) => {
    setValores(prev => prev.map(v => v.id === id ? { ...v, color: randomColor() } : v))
  }

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
        saidas.forEach(v => lines.push(`• ${v.description}: ${fmt.format(v.value)}`))
        lines.push(`Total: ${fmt.format(totalSaidas)}\n`)
      }
      if (entradas.length > 0) {
        lines.push('Entradas')
        entradas.forEach(v => lines.push(`• ${v.description}: ${fmt.format(v.value)}`))
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
          <h1 className="title">Valores</h1>
          {hasValues && (
            <span className={`saldo ${saldo >= 0 ? 'positivo' : 'negativo'}`}>
              {saldo >= 0 ? '+' : ''}{fmt.format(saldo)}
            </span>
          )}
        </div>
        <div className="header-actions">
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
            {dataLoading ? '…' : hasValues ? '✎ Editar valores' : '+ Adicionar valores'}
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
            + Adicionar valores
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
                  <ValorCard key={v.id} valor={v} onColorChange={() => handleColorChange(v.id)} />
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
                  <ValorCard key={v.id} valor={v} onColorChange={() => handleColorChange(v.id)} />
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
