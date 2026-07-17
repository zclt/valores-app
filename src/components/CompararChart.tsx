import type { CategoriaComparada } from '../utils/compareColecoes'
import { deltaClass, formatDelta } from '../utils/compareColecoes'
import './CompararChart.css'

interface Props {
  titulo: string
  categorias: CategoriaComparada[]
}

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function Linha({ categoria, maxValue }: { categoria: CategoriaComparada; maxValue: number }) {
  const { description, valueA, valueB, delta, deltaPct, status, type } = categoria
  const pctA = maxValue > 0 ? (valueA / maxValue) * 100 : 0
  const pctB = maxValue > 0 ? (valueB / maxValue) * 100 : 0
  return (
    <div className="par-row">
      <div className="par-label">
        <span className="par-desc">{description}</span>
        {status !== 'comum' && <span className="par-badge">{status}</span>}
        <span className={`par-delta ${deltaClass(type, delta)}`}>{formatDelta(deltaPct)}</span>
      </div>
      <div className="par-bars">
        <div className="par-track">
          <div className="par-fill serie-a" style={{ width: `${pctA}%` }} />
        </div>
        <div className="par-track">
          <div className="par-fill serie-b" style={{ width: `${pctB}%` }} />
        </div>
      </div>
      <div className="par-valores">
        <span className="par-valor serie-a">{fmt.format(valueA)}</span>
        <span className="par-valor serie-b">{fmt.format(valueB)}</span>
      </div>
    </div>
  )
}

export default function CompararChart({ titulo, categorias }: Props) {
  const maxValue = Math.max(...categorias.flatMap(c => [c.valueA, c.valueB]), 0)
  return (
    <div className="comparar-chart">
      <p className="comparar-chart-titulo">{titulo}</p>
      {categorias.length === 0 ? (
        <p className="comparar-chart-empty">Sem {titulo.toLowerCase()}</p>
      ) : (
        <div className="par-list">
          {categorias.map(c => (
            <Linha key={`${c.type}:${c.description}`} categoria={c} maxValue={maxValue} />
          ))}
        </div>
      )}
    </div>
  )
}
