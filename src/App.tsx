import { useState } from 'react'
import ValoresInput from './components/ValoresInput'
import ValorCard from './components/ValorCard'
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

const STORAGE_KEY = 'valores-app-data'

function loadStorage(): { textSaida: string; textEntrada: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { textSaida: '', textEntrada: '' }
  } catch {
    return { textSaida: '', textEntrada: '' }
  }
}

export default function App() {
  const [showInput, setShowInput] = useState(false)
  const [textSaida, setTextSaida] = useState(() => loadStorage().textSaida)
  const [textEntrada, setTextEntrada] = useState(() => loadStorage().textEntrada)
  const [valores, setValores] = useState<Valor[]>(() => {
    const { textSaida, textEntrada } = loadStorage()
    return [...parseValores(textSaida, 'saida'), ...parseValores(textEntrada, 'entrada')]
  })

  const handleApply = (ts: string, te: string) => {
    setTextSaida(ts)
    setTextEntrada(te)
    setValores([...parseValores(ts, 'saida'), ...parseValores(te, 'entrada')])
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ textSaida: ts, textEntrada: te }))
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
        <button className="btn-primary" onClick={() => setShowInput(true)}>
          {hasValues ? '✎ Editar valores' : '+ Adicionar valores'}
        </button>
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

      {showInput && (
        <ValoresInput
          initialTextSaida={textSaida}
          initialTextEntrada={textEntrada}
          onApply={handleApply}
          onClose={() => setShowInput(false)}
        />
      )}
    </div>
  )
}
