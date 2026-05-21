import type { Valor } from '../App'
import './ValoresChart.css'

interface Props {
  saidas: Valor[]
  entradas: Valor[]
  totalSaidas: number
  totalEntradas: number
}

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function Bar({ valor, maxValue }: { valor: Valor; maxValue: number }) {
  const pct = maxValue > 0 ? (valor.value / maxValue) * 100 : 0
  return (
    <div className="bar-row">
      <span className="bar-label">{valor.description}</span>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: valor.color }} />
      </div>
      <span className="bar-value">{fmt.format(valor.value)}</span>
    </div>
  )
}

export default function ValoresChart({ saidas, entradas, totalSaidas, totalEntradas }: Props) {
  const maxValue = Math.max(...[...saidas, ...entradas].map(v => v.value), 0)
  const grand = totalSaidas + totalEntradas
  const saidaPct = grand > 0 ? (totalSaidas / grand) * 100 : 50
  const entradaPct = grand > 0 ? (totalEntradas / grand) * 100 : 50

  return (
    <footer className="chart-footer">
      <div className="chart-proportion">
        <div className="prop-bar">
          <div className="prop-saida" style={{ width: `${saidaPct}%` }} />
          <div className="prop-entrada" style={{ width: `${entradaPct}%` }} />
        </div>
        <div className="prop-labels">
          <span className="prop-label saida-label">Saídas {saidaPct.toFixed(0)}%</span>
          <span className="prop-label entrada-label">Entradas {entradaPct.toFixed(0)}%</span>
        </div>
      </div>

      <div className="chart-columns">
        <div className="chart-col">
          {saidas.length === 0
            ? <p className="chart-empty">Sem saídas</p>
            : saidas.map(v => <Bar key={v.id} valor={v} maxValue={maxValue} />)
          }
        </div>

        <div className="chart-separator" />

        <div className="chart-col">
          {entradas.length === 0
            ? <p className="chart-empty">Sem entradas</p>
            : entradas.map(v => <Bar key={v.id} valor={v} maxValue={maxValue} />)
          }
        </div>
      </div>
    </footer>
  )
}
