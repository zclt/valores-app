import type { Valor } from '../App'
import './ValorCard.css'

interface Props {
  valor: Valor
  onColorChange: () => void
  onToggleDone: () => void
}

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export default function ValorCard({ valor, onColorChange, onToggleDone }: Props) {
  return (
    <div
      className={`card${valor.done ? ' done' : ''}`}
      style={{ background: valor.color }}
      onDoubleClick={onToggleDone}
    >
      {valor.done && (
        <span className="card-done-badge">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          ok
        </span>
      )}
      <button
        className="card-color-btn"
        onClick={e => { e.stopPropagation(); onColorChange() }}
        onDoubleClick={e => e.stopPropagation()}
        title="Trocar cor"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a10 10 0 0 1 10 10" />
          <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
        </svg>
      </button>
      <div className="card-value">{fmt.format(valor.value)}</div>
      <div className="card-desc">{valor.description}</div>
    </div>
  )
}
