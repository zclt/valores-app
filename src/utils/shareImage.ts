import type { Valor } from '../App'

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function clip(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let t = text
  while (t.length > 0 && ctx.measureText(t + '…').width > maxWidth) t = t.slice(0, -1)
  return t + '…'
}

export async function generateShareImage(
  saidas: Valor[],
  entradas: Valor[],
  totalSaidas: number,
  totalEntradas: number
): Promise<Blob> {
  const SCALE  = 2
  const W      = 680
  const PAD    = 32
  const GAP    = 24
  const COL_W  = (W - PAD * 2 - GAP) / 2
  const ROW_H  = 44
  const maxRows = Math.max(saidas.length, entradas.length, 1)
  const H = 48 + 20 + 12 + 44 + 16 + maxRows * ROW_H + 48

  const canvas = document.createElement('canvas')
  canvas.width  = W * SCALE
  canvas.height = H * SCALE
  const ctx = canvas.getContext('2d')!
  ctx.scale(SCALE, SCALE)

  const font = (size: number, weight = 400) =>
    `${weight} ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

  // ── background ──────────────────────────────────────────────
  ctx.fillStyle = '#0d0d18'
  ctx.fillRect(0, 0, W, H)

  // subtle grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.03)'
  ctx.lineWidth = 1
  for (let x = PAD; x < W - PAD; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
  }

  // ── header ──────────────────────────────────────────────────
  let y = 36

  ctx.font = font(22, 700)
  ctx.fillStyle = '#ffffff'
  ctx.fillText('Valores', PAD, y)

  const saldo = totalEntradas - totalSaidas
  const saldoTxt = (saldo >= 0 ? '+' : '') + fmt.format(saldo)
  ctx.font = font(13, 600)
  const saldoColor = saldo >= 0 ? '#4ade80' : '#f87171'
  ctx.fillStyle = saldoColor

  // saldo pill
  const saldoW = ctx.measureText(saldoTxt).width + 20
  const saldoX = PAD + ctx.measureText('Valores').width + 14
  rr(ctx, saldoX, y - 15, saldoW, 22, 11)
  ctx.fillStyle = saldo >= 0 ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)'
  ctx.fill()
  ctx.fillStyle = saldoColor
  ctx.fillText(saldoTxt, saldoX + 10, y)

  y += 20

  // ── proportion bar ───────────────────────────────────────────
  const grand  = totalSaidas + totalEntradas
  const barW   = W - PAD * 2
  const barH   = 6
  rr(ctx, PAD, y, barW, barH, 3)
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  ctx.fill()

  if (grand > 0) {
    const sw = (totalSaidas  / grand) * barW
    const ew = (totalEntradas / grand) * barW
    if (sw > 0) { rr(ctx, PAD,      y, sw, barH, 3); ctx.fillStyle = '#f87171'; ctx.fill() }
    if (ew > 0) { rr(ctx, PAD + sw, y, ew, barH, 3); ctx.fillStyle = '#4ade80'; ctx.fill() }
  }

  y += barH + 12

  // ── separator ────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke()
  y += 16

  // ── columns ──────────────────────────────────────────────────
  const drawColumn = (items: Valor[], total: number, cx: number, isEntrada: boolean) => {
    const accent = isEntrada ? '#4ade80' : '#f87171'
    const label  = isEntrada ? 'ENTRADAS' : 'SAÍDAS'
    let cy = y

    // column header pill
    rr(ctx, cx, cy, COL_W, 36, 10)
    ctx.fillStyle = isEntrada ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)'
    ctx.fill()

    ctx.font = font(10, 700)
    ctx.fillStyle = accent
    ctx.letterSpacing = '0.08em'
    ctx.fillText(label, cx + 10, cy + 14)
    ctx.letterSpacing = '0'

    ctx.font = font(12, 600)
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    const totTxt = fmt.format(total)
    const totW   = ctx.measureText(totTxt).width
    ctx.fillText(totTxt, cx + COL_W - 10 - totW, cy + 14)

    cy += 36 + 10

    const maxVal = Math.max(...[...saidas, ...entradas].map(v => v.value), 1)

    items.forEach(item => {
      ctx.globalAlpha = item.done ? 0.4 : 1

      // row bg
      rr(ctx, cx, cy, COL_W, ROW_H - 4, 8)
      ctx.fillStyle = 'rgba(255,255,255,0.04)'
      ctx.fill()

      // color accent bar
      rr(ctx, cx, cy, 4, ROW_H - 4, 2)
      ctx.fillStyle = item.color
      ctx.fill()

      // proportion fill
      const pct = item.value / maxVal
      rr(ctx, cx, cy, Math.max(4, COL_W * pct), ROW_H - 4, 8)
      ctx.globalAlpha = item.done ? 0.07 : 0.18
      ctx.fillStyle = item.color
      ctx.fill()
      ctx.globalAlpha = item.done ? 0.4 : 1

      // check icon (done)
      const descX = cx + 12
      if (item.done) {
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'
        ctx.lineWidth = 1.5
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(descX, cy + 10)
        ctx.lineTo(descX + 4, cy + 14)
        ctx.lineTo(descX + 9, cy + 6)
        ctx.stroke()
      }

      // description
      ctx.font = font(11, 500)
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      const descOffsetX = item.done ? descX + 13 : descX
      ctx.fillText(clip(ctx, item.description, COL_W - 24), descOffsetX, cy + 14)

      // value
      ctx.font = font(13, 700)
      ctx.fillStyle = '#ffffff'
      const valTxt = fmt.format(item.value)
      ctx.fillText(valTxt, cx + 12, cy + 30)

      // strikethrough on value (done)
      if (item.done) {
        const valW = ctx.measureText(valTxt).width
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(cx + 12, cy + 23)
        ctx.lineTo(cx + 12 + valW, cy + 23)
        ctx.stroke()
      }

      ctx.globalAlpha = 1
      cy += ROW_H
    })
  }

  const leftX  = PAD
  const rightX = PAD + COL_W + GAP

  drawColumn(saidas,   totalSaidas,   leftX,  false)
  drawColumn(entradas, totalEntradas, rightX, true)

  // ── watermark ────────────────────────────────────────────────
  ctx.font = font(10, 400)
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  const dateStr = new Date().toLocaleDateString('pt-BR')
  ctx.fillText(`Valores App · ${dateStr}`, PAD, H - 16)

  return new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('blob error'))), 'image/png')
  })
}
