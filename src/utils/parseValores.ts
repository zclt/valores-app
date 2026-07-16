import type { ValorType, Valor } from '../App'

export function randomColor(): string {
  const hue = Math.floor(Math.random() * 360)
  const sat = 65 + Math.floor(Math.random() * 20)
  const light = 45 + Math.floor(Math.random() * 12)
  return `hsl(${hue}, ${sat}%, ${light}%)`
}

export function parseValores(text: string, type: ValorType): Valor[] {
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
