import { useMemo, useState } from 'react'
import type { Colecao } from '../hooks/useColecoes'
import type { TotaisComparados } from '../utils/compareColecoes'
import { compareColecoes, deltaClass, formatDelta } from '../utils/compareColecoes'
import CompararChart from './CompararChart'
import './CompararModal.css'

interface Props {
  colecoes: Colecao[]
  onClose: () => void
}

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtDate = (d: Date) =>
  d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })

function StatRow({ label, totais, type }: { label: string; totais: TotaisComparados; type: 'saida' | 'entrada' }) {
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <span className="stat-valor serie-a">{fmt.format(totais.totalA)}</span>
      <span className="stat-seta">→</span>
      <span className="stat-valor serie-b">{fmt.format(totais.totalB)}</span>
      <span className={`stat-delta ${deltaClass(type, totais.delta)}`}>{formatDelta(totais.deltaPct)}</span>
    </div>
  )
}

export default function CompararModal({ colecoes, onClose }: Props) {
  const [idA, setIdA] = useState<string | null>(colecoes[0]?.id ?? null)
  const [idB, setIdB] = useState<string | null>(colecoes[1]?.id ?? null)

  const colecaoA = colecoes.find(c => c.id === idA) ?? null
  const colecaoB = colecoes.find(c => c.id === idB) ?? null

  const resultado = useMemo(() => {
    if (!colecaoA || !colecaoB || colecaoA.id === colecaoB.id) return null
    return compareColecoes(colecaoA, colecaoB)
  }, [colecaoA, colecaoB])

  const handleSwap = () => {
    setIdA(idB)
    setIdB(idA)
  }

  return (
    <div className="comparar-overlay" onClick={onClose}>
      <div className="comparar-panel" onClick={e => e.stopPropagation()}>
        <div className="comparar-header">
          <span className="comparar-title">Comparar coleções</span>
          <button className="comparar-close" onClick={onClose}>✕</button>
        </div>

        <div className="comparar-pickers">
          <select className="comparar-select" value={idA ?? ''} onChange={e => setIdA(e.target.value)}>
            {colecoes.map(c => (
              <option key={c.id} value={c.id} disabled={c.id === idB}>
                {c.name} ({fmtDate(c.savedAt)})
              </option>
            ))}
          </select>
          <button className="comparar-swap" onClick={handleSwap} title="Trocar">⇄</button>
          <select className="comparar-select" value={idB ?? ''} onChange={e => setIdB(e.target.value)}>
            {colecoes.map(c => (
              <option key={c.id} value={c.id} disabled={c.id === idA}>
                {c.name} ({fmtDate(c.savedAt)})
              </option>
            ))}
          </select>
        </div>

        {!resultado ? (
          <p className="comparar-hint">Selecione duas coleções diferentes para comparar.</p>
        ) : (
          <div className="comparar-body">
            <div className="comparar-legenda">
              <span className="legenda-item"><span className="legenda-dot serie-a" />{resultado.colecaoA.name}</span>
              <span className="legenda-item"><span className="legenda-dot serie-b" />{resultado.colecaoB.name}</span>
            </div>

            <div className="comparar-stats">
              <StatRow label="Saídas" totais={resultado.totalSaidas} type="saida" />
              <StatRow label="Entradas" totais={resultado.totalEntradas} type="entrada" />
              <StatRow label="Saldo" totais={resultado.saldo} type="entrada" />
            </div>

            <CompararChart titulo="Saídas" categorias={resultado.saidas} />
            <CompararChart titulo="Entradas" categorias={resultado.entradas} />
          </div>
        )}
      </div>
    </div>
  )
}
