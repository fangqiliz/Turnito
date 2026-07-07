import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Exportación de citas a un archivo .xlsx con diseño de marca.
 *
 * El reporte incluye:
 *   - Logo del negocio embebido (si existe y es accesible por CORS).
 *   - Encabezado con nombre del negocio y título del reporte.
 *   - Metadatos (fecha de generación, rango, totales).
 *   - Bloque de KPIs (resumen por estado + ingresos estimados).
 *   - Tabla de citas con estilo (cabecera de marca, filas cebra, colores por estado).
 *   - Fila de totales.
 *
 * @param {object}   params
 * @param {object}   params.business       Negocio activo ({ name, logo_url, phone, address, slug }).
 * @param {object[]} params.appointments   Lista de citas (con relaciones services/employees).
 * @param {object}   [params.stats]        KPIs precalculados; si se omite se derivan de las citas.
 */

// ── Paleta de marca ──────────────────────────────────────────────────────────
const BRAND = 'FF7C3AED' // Púrpura Turnito
const BRAND_DARK = 'FF5B21B6'
const HEADER_TEXT = 'FFFFFFFF'
const ZEBRA = 'FFF5F3FF' // Lila muy claro
const BORDER = 'FFE5E7EB'
const TEXT_MUTED = 'FF6B7280'

const STATUS_META = {
  pending:   { label: 'Pendiente',  fill: 'FFFEF3C7', font: 'FF92400E' },
  confirmed: { label: 'Confirmada', fill: 'FFDBEAFE', font: 'FF1E40AF' },
  completed: { label: 'Completada', fill: 'FFDCFCE7', font: 'FF166534' },
  cancelled: { label: 'Cancelada',  fill: 'FFFEE2E2', font: 'FF991B1B' },
  no_show:   { label: 'No asistió',  fill: 'FFF3F4F6', font: 'FF6B7280' },
}

const COLUMNS = [
  { header: 'Fecha',    key: 'date',     width: 14 },
  { header: 'Inicio',   key: 'start',    width: 9  },
  { header: 'Fin',      key: 'end',      width: 9  },
  { header: 'Cliente',  key: 'client',   width: 24 },
  { header: 'Email',    key: 'email',    width: 26 },
  { header: 'Teléfono', key: 'phone',    width: 16 },
  { header: 'Servicio', key: 'service',  width: 22 },
  { header: 'Empleado', key: 'employee', width: 20 },
  { header: 'Estado',   key: 'status',   width: 14 },
  { header: 'Precio',   key: 'price',    width: 12 },
  { header: 'Notas',    key: 'notes',    width: 30 },
]

const TOTAL_COLS = COLUMNS.length // 11 → A..K

/** Descarga la imagen del logo y la devuelve como base64 + extensión, o null. */
async function fetchLogo(logoUrl) {
  if (!logoUrl) return null
  try {
    const res = await fetch(logoUrl, { mode: 'cors' })
    if (!res.ok) return null
    const blob = await res.blob()
    const type = blob.type || ''
    let extension = 'png'
    if (type.includes('jpeg') || type.includes('jpg')) extension = 'jpeg'
    else if (type.includes('gif')) extension = 'gif'
    else if (type.includes('png')) extension = 'png'
    else return null // exceljs solo soporta png/jpeg/gif

    const buffer = await blob.arrayBuffer()
    let binary = ''
    const bytes = new Uint8Array(buffer)
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
    const base64 = btoa(binary)
    return { base64, extension }
  } catch {
    return null
  }
}

/** Calcula KPIs a partir de las citas. */
function deriveStats(appointments) {
  const s = { total: appointments.length, pending: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0, revenue: 0 }
  for (const a of appointments) {
    if (s[a.status] !== undefined) s[a.status] += 1
    // Ingresos estimados: solo citas confirmadas o completadas
    if (a.status === 'confirmed' || a.status === 'completed') {
      s.revenue += Number(a.services?.price ?? 0)
    }
  }
  return s
}

function thinBorder() {
  return {
    top:    { style: 'thin', color: { argb: BORDER } },
    bottom: { style: 'thin', color: { argb: BORDER } },
    left:   { style: 'thin', color: { argb: BORDER } },
    right:  { style: 'thin', color: { argb: BORDER } },
  }
}

export async function exportAppointmentsToXlsx({ business, appointments, stats }) {
  const { default: ExcelJS } = await import('exceljs')
  const kpis = stats ?? deriveStats(appointments)
  const bizName = business?.name ?? 'Negocio'

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Turnito'
  workbook.created = new Date()

  const ws = workbook.addWorksheet('Citas', {
    views: [{ state: 'frozen', ySplit: 7 }], // congela hasta la cabecera de la tabla
    properties: { defaultRowHeight: 18 },
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  })

  // Anchos de columna
  ws.columns = COLUMNS.map((c) => ({ key: c.key, width: c.width }))

  const lastColLetter = ws.getColumn(TOTAL_COLS).letter // 'K'

  // ── Fila 1-4: banda de marca con logo + títulos ────────────────────────────
  // Pintamos la banda celda por celda (sin un merge global) para poder fusionar
  // luego las sub-zonas del título/subtítulo sin colisionar con un merge previo.
  for (let r = 1; r <= 4; r++) {
    const row = ws.getRow(r)
    row.height = 22
    for (let c = 1; c <= TOTAL_COLS; c++) {
      row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND } }
    }
  }

  // Logo (opcional)
  const logo = await fetchLogo(business?.logo_url)
  let titleStartCol = 'A'
  if (logo) {
    const imageId = workbook.addImage({ base64: `data:image/${logo.extension};base64,${logo.base64}`, extension: logo.extension })
    // Insertar dentro de la banda, esquina superior izquierda
    ws.addImage(imageId, {
      tl: { col: 0.25, row: 0.35 },
      ext: { width: 76, height: 76 },
      editAs: 'oneCell',
    })
    titleStartCol = 'B'
  }

  // Título del negocio (nombre) y subtítulo
  ws.mergeCells(`${titleStartCol}1:${lastColLetter}2`)
  const titleCell = ws.getCell(`${titleStartCol}1`)
  titleCell.value = bizName
  titleCell.font = { name: 'Calibri', size: 20, bold: true, color: { argb: HEADER_TEXT } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }

  ws.mergeCells(`${titleStartCol}3:${lastColLetter}4`)
  const subtitleCell = ws.getCell(`${titleStartCol}3`)
  subtitleCell.value = 'Reporte de Citas'
  subtitleCell.font = { name: 'Calibri', size: 12, color: { argb: 'FFEDE9FE' } }
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }

  // ── Fila 5: metadatos ──────────────────────────────────────────────────────
  ws.mergeCells(`A5:${lastColLetter}5`)
  const metaCell = ws.getCell('A5')
  const metaParts = [
    `Generado: ${format(new Date(), "d 'de' MMMM yyyy, HH:mm", { locale: es })}`,
    `Total de citas: ${kpis.total}`,
  ]
  if (business?.phone) metaParts.push(`Tel: ${business.phone}`)
  metaCell.value = metaParts.join('     •     ')
  metaCell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: TEXT_MUTED } }
  metaCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  ws.getRow(5).height = 18

  // ── Fila 6: tarjetas KPI ───────────────────────────────────────────────────
  const kpiCards = [
    { label: 'TOTAL',       value: kpis.total,               fill: 'FFEDE9FE', font: BRAND_DARK },
    { label: 'PENDIENTES',  value: kpis.pending,             fill: STATUS_META.pending.fill,   font: STATUS_META.pending.font },
    { label: 'CONFIRMADAS', value: kpis.confirmed,           fill: STATUS_META.confirmed.fill, font: STATUS_META.confirmed.font },
    { label: 'COMPLETADAS', value: kpis.completed,           fill: STATUS_META.completed.fill, font: STATUS_META.completed.font },
    { label: 'CANCELADAS',  value: kpis.cancelled,           fill: STATUS_META.cancelled.fill, font: STATUS_META.cancelled.font },
    { label: 'INGRESOS EST.', value: kpis.revenue, currency: true, fill: 'FFDCFCE7', font: STATUS_META.completed.font },
  ]
  // Distribuir las 6 tarjetas sobre las 11 columnas (~2 cols c/u, la última ocupa el resto)
  ws.getRow(6).height = 40
  let col = 1
  kpiCards.forEach((card, idx) => {
    const span = idx === kpiCards.length - 1 ? TOTAL_COLS - col + 1 : 2
    const startL = ws.getColumn(col).letter
    const endL = ws.getColumn(col + span - 1).letter
    ws.mergeCells(`${startL}6:${endL}6`)
    const cell = ws.getCell(`${startL}6`)
    cell.value = {
      richText: [
        { text: `${card.label}\n`, font: { size: 8, bold: true, color: { argb: TEXT_MUTED } } },
        {
          text: card.currency ? `$${Number(card.value).toLocaleString('es-DO', { minimumFractionDigits: 2 })}` : String(card.value),
          font: { size: 16, bold: true, color: { argb: card.font } },
        },
      ],
    }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: card.fill } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = thinBorder()
    col += span
  })

  // ── Fila 7: cabecera de la tabla ───────────────────────────────────────────
  const headerRow = ws.getRow(7)
  COLUMNS.forEach((c, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = c.header
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: HEADER_TEXT } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK } }
    cell.alignment = { vertical: 'middle', horizontal: c.key === 'price' ? 'right' : 'left', indent: 1 }
    cell.border = thinBorder()
  })
  headerRow.height = 22

  // ── Filas de datos ─────────────────────────────────────────────────────────
  const sorted = [...appointments].sort(
    (a, b) => new Date(a.start_time) - new Date(b.start_time)
  )

  sorted.forEach((appt, idx) => {
    const start = new Date(appt.start_time)
    const end = appt.end_time ? new Date(appt.end_time) : null
    const meta = STATUS_META[appt.status] ?? { label: appt.status ?? '—', fill: 'FFF3F4F6', font: TEXT_MUTED }
    const price = Number(appt.services?.price ?? 0)

    const row = ws.addRow({
      date:     format(start, 'dd/MM/yyyy'),
      start:    format(start, 'HH:mm'),
      end:      end ? format(end, 'HH:mm') : '—',
      client:   appt.client_name ?? '—',
      email:    appt.client_email ?? '—',
      phone:    appt.client_phone ?? '—',
      service:  appt.services?.name ?? '—',
      employee: appt.employees?.full_name ?? 'Sin asignar',
      status:   meta.label,
      price:    price,
      notes:    appt.notes ?? '',
    })

    row.height = 20
    row.eachCell((cell, colNumber) => {
      cell.border = thinBorder()
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1, wrapText: false }
      cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF374151' } }
      // Cebra
      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA } }
      }
      // Columna Precio: formato moneda + alineación derecha
      if (colNumber === 10) {
        cell.numFmt = '"$"#,##0.00'
        cell.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 }
      }
    })

    // Píldora de estado (columna 9)
    const statusCell = row.getCell(9)
    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: meta.fill } }
    statusCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: meta.font } }
    statusCell.alignment = { vertical: 'middle', horizontal: 'center' }
  })

  // ── Fila de totales ────────────────────────────────────────────────────────
  const totalRow = ws.addRow({})
  totalRow.height = 22
  const totalLabelCell = totalRow.getCell(8)
  totalLabelCell.value = 'INGRESOS ESTIMADOS'
  totalLabelCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: HEADER_TEXT } }
  totalLabelCell.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 }
  const totalValueCell = totalRow.getCell(10)
  totalValueCell.value = kpis.revenue
  totalValueCell.numFmt = '"$"#,##0.00'
  totalValueCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: HEADER_TEXT } }
  totalValueCell.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 }
  for (let c = 1; c <= TOTAL_COLS; c++) {
    totalRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND } }
    totalRow.getCell(c).border = thinBorder()
  }

  if (sorted.length === 0) {
    const emptyRow = ws.addRow({})
    ws.mergeCells(`A${emptyRow.number}:${lastColLetter}${emptyRow.number}`)
    const cell = ws.getCell(`A${emptyRow.number}`)
    cell.value = 'No hay citas para exportar con los filtros seleccionados.'
    cell.font = { italic: true, color: { argb: TEXT_MUTED } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  }

  // Filtros/autofiltro sobre la cabecera
  ws.autoFilter = { from: `A7`, to: `${lastColLetter}7` }

  // ── Generar y descargar ────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const safeName = bizName.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'negocio'
  link.href = url
  link.download = `citas-${safeName}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
