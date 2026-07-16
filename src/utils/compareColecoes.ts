import type { ValorType } from '../App'
import type { Colecao } from '../hooks/useColecoes'
import { parseValores } from './parseValores'

export interface CategoriaComparada {
  type: ValorType
  description: string
  valueA: number
  valueB: number
  delta: number
  deltaPct: number | null
  status: 'comum' | 'novo' | 'removido'
}

export interface TotaisComparados {
  totalA: number
  totalB: number
  delta: number
  deltaPct: number | null
}

export interface ComparacaoResult {
  colecaoA: { id: string; name: string }
  colecaoB: { id: string; name: string }
  saidas: CategoriaComparada[]
  entradas: CategoriaComparada[]
  totalSaidas: TotaisComparados
  totalEntradas: TotaisComparados
  saldo: TotaisComparados
}

function pct(from: number, to: number): number | null {
  if (from === 0) return to === 0 ? 0 : null
  return ((to - from) / from) * 100
}

export function deltaClass(type: ValorType, delta: number): string {
  if (delta === 0) return ''
  const bom = type === 'saida' ? delta < 0 : delta > 0
  return bom ? 'delta-positivo' : 'delta-negativo'
}

export function formatDelta(deltaPct: number | null): string {
  if (deltaPct === null) return 'novo'
  return `${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(0)}%`
}

function totais(from: number, to: number): TotaisComparados {
  return { totalA: from, totalB: to, delta: to - from, deltaPct: pct(from, to) }
}

function somarPorDescricao(text: string, type: ValorType): Map<string, number> {
  const map = new Map<string, number>()
  for (const v of parseValores(text, type)) {
    const key = `${v.type}:${v.description}`
    map.set(key, (map.get(key) ?? 0) + v.value)
  }
  return map
}

function comparar(type: ValorType, mapA: Map<string, number>, mapB: Map<string, number>): CategoriaComparada[] {
  const keys = new Set([...mapA.keys(), ...mapB.keys()])
  const categorias: CategoriaComparada[] = []
  for (const key of keys) {
    const description = key.slice(type.length + 1)
    const valueA = mapA.get(key) ?? 0
    const valueB = mapB.get(key) ?? 0
    const status = mapA.has(key) && mapB.has(key) ? 'comum' : mapA.has(key) ? 'removido' : 'novo'
    categorias.push({ type, description, valueA, valueB, delta: valueB - valueA, deltaPct: pct(valueA, valueB), status })
  }
  return categorias.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
}

export function compareColecoes(a: Colecao, b: Colecao): ComparacaoResult {
  const saidaMapA = somarPorDescricao(a.textSaida, 'saida')
  const saidaMapB = somarPorDescricao(b.textSaida, 'saida')
  const entradaMapA = somarPorDescricao(a.textEntrada, 'entrada')
  const entradaMapB = somarPorDescricao(b.textEntrada, 'entrada')

  const saidas = comparar('saida', saidaMapA, saidaMapB)
  const entradas = comparar('entrada', entradaMapA, entradaMapB)

  const totalSaidaA = [...saidaMapA.values()].reduce((s, v) => s + v, 0)
  const totalSaidaB = [...saidaMapB.values()].reduce((s, v) => s + v, 0)
  const totalEntradaA = [...entradaMapA.values()].reduce((s, v) => s + v, 0)
  const totalEntradaB = [...entradaMapB.values()].reduce((s, v) => s + v, 0)

  return {
    colecaoA: { id: a.id, name: a.name },
    colecaoB: { id: b.id, name: b.name },
    saidas,
    entradas,
    totalSaidas: totais(totalSaidaA, totalSaidaB),
    totalEntradas: totais(totalEntradaA, totalEntradaB),
    saldo: totais(totalEntradaA - totalSaidaA, totalEntradaB - totalSaidaB),
  }
}
