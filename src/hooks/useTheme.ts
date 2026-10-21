import { useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'valores_theme'

// The initial theme is applied to <html data-theme> by the inline script in index.html,
// so the first paint already matches; this hook just reads it back and handles toggling.
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(
    () => document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
  )

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch { /* storage unavailable — theme still applies for this session */ }
    setTheme(next)
  }

  return { theme, toggleTheme }
}
