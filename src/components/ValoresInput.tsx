import { useState, useEffect, useRef } from 'react'
import './ValoresInput.css'

interface Props {
  initialTextSaida: string
  initialTextEntrada: string
  onApply: (textSaida: string, textEntrada: string) => void
  onClose: () => void
}

type Tab = 'saida' | 'entrada'

const PLACEHOLDERS: Record<Tab, string> = {
  saida:   '1500 aluguel\n800 mercado\n350 luz\n200 internet',
  entrada: '5000 salário\n1200 freelance\n300 dividendos',
}

export default function ValoresInput({ initialTextSaida, initialTextEntrada, onApply, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('saida')
  const [textSaida, setTextSaida] = useState(initialTextSaida)
  const [textEntrada, setTextEntrada] = useState(initialTextEntrada)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [tab])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') onApply(textSaida, textEntrada)
  }

  const currentText = tab === 'saida' ? textSaida : textEntrada
  const setCurrentText = tab === 'saida' ? setTextSaida : setTextEntrada

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="modal-header">
          <h2>Valores</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="tab-switch">
          <button
            className={`tab-btn ${tab === 'saida' ? 'tab-active saida-active' : ''}`}
            onClick={() => setTab('saida')}
          >
            Saídas
          </button>
          <button
            className={`tab-btn ${tab === 'entrada' ? 'tab-active entrada-active' : ''}`}
            onClick={() => setTab('entrada')}
          >
            Entradas
          </button>
        </div>

        <p className="hint">
          Um por linha: <code>1000 descrição</code> &nbsp;·&nbsp; <kbd>⌘ Enter</kbd> para aplicar
        </p>

        <textarea
          key={tab}
          ref={textareaRef}
          className={`memo ${tab === 'saida' ? 'memo-saida' : 'memo-entrada'}`}
          value={currentText}
          onChange={e => setCurrentText(e.target.value)}
          placeholder={PLACEHOLDERS[tab]}
          spellCheck={false}
        />

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={() => onApply(textSaida, textEntrada)}>Aplicar</button>
        </div>
      </div>
    </div>
  )
}
