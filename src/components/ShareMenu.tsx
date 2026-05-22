import './ShareMenu.css'

interface Props {
  onImage: () => void
  onText: () => void
  onClose: () => void
  loading: 'image' | 'text' | null
}

export default function ShareMenu({ onImage, onText, onClose, loading }: Props) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="share-menu" onClick={e => e.stopPropagation()}>
        <p className="share-title">Compartilhar</p>
        <div className="share-options">
          <button className="share-option" onClick={onImage} disabled={loading !== null}>
            {loading === 'image'
              ? <span className="spinner" />
              : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
            }
            <span>Imagem</span>
          </button>

          <button className="share-option" onClick={onText} disabled={loading !== null}>
            {loading === 'text'
              ? <span className="spinner" />
              : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="8" y1="13" x2="16" y2="13" />
                  <line x1="8" y1="17" x2="13" y2="17" />
                </svg>
            }
            <span>Texto</span>
          </button>
        </div>
      </div>
    </div>
  )
}
