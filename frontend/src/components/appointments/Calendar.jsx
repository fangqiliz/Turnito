import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from 'date-fns'
import { es } from 'date-fns/locale'

const DAY_NAMES = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']

/**
 * Visual month calendar for filtering appointments by date.
 * Days with appointments show a dot indicator.
 * Clicking a selected day deselects (clears the filter).
 *
 * Props:
 *   appointments  — array of appointment objects with `start_time` field
 *   selectedDate  — 'YYYY-MM-DD' string or empty string
 *   onDateSelect  — (dateStr: string) => void
 */
export default function Calendar({ appointments = [], selectedDate = '', onDateSelect }) {
  const [viewMonth, setViewMonth] = useState(() => {
    if (selectedDate) return new Date(selectedDate + 'T12:00:00')
    return new Date()
  })

  const monthStart = startOfMonth(viewMonth)
  const monthEnd   = endOfMonth(viewMonth)
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd     = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days       = eachDayOfInterval({ start: calStart, end: calEnd })

  const apptDates = new Set(
    appointments.map(a => {
      if (!a.start_time) return null
      const date = parseISO(a.start_time)
      return format(date, 'yyyy-MM-dd')
    }).filter(Boolean)
  )

  const handleDayClick = (day) => {
    if (!isSameMonth(day, viewMonth)) return
    const str = format(day, 'yyyy-MM-dd')
    onDateSelect(selectedDate === str ? '' : str)
  }

  return (
    <div style={{
      background:   'var(--color-bg-secondary)',
      border:       '1px solid var(--color-border)',
      borderRadius: 'var(--radius-xl)',
      padding:      'var(--space-4)',
    }}>
      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
        <NavBtn onClick={() => setViewMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>
          <ChevronLeft size={14} />
        </NavBtn>
        <span style={{
          fontWeight:    'var(--font-weight-semibold)',
          fontSize:      'var(--font-size-sm)',
          color:         'var(--color-text-primary)',
          textTransform: 'capitalize',
        }}>
          {format(viewMonth, 'MMMM yyyy', { locale: es })}
        </span>
        <NavBtn onClick={() => setViewMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>
          <ChevronRight size={14} />
        </NavBtn>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
        {DAY_NAMES.map(d => (
          <div key={d} style={{
            textAlign:     'center',
            fontSize:      '10px',
            fontWeight:    'var(--font-weight-semibold)',
            color:         'var(--color-text-muted)',
            padding:       '4px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {days.map(day => {
          const str        = format(day, 'yyyy-MM-dd')
          const inMonth    = isSameMonth(day, viewMonth)
          const isSelected = selectedDate === str
          const today      = isToday(day)
          const hasAppts   = inMonth && apptDates.has(str)

          return (
            <button
              key={str}
              onClick={() => handleDayClick(day)}
              disabled={!inMonth}
              style={{
                position:       'relative',
                width:          '100%',
                aspectRatio:    '1',
                borderRadius:   'var(--radius-md)',
                border:         'none',
                background:      isSelected
                  ? 'var(--color-accent)'
                  : today && !isSelected
                  ? 'var(--color-accent-subtle)'
                  : 'transparent',
                color:           isSelected
                  ? '#fff'
                  : !inMonth
                  ? 'transparent'
                  : today
                  ? 'var(--color-accent-light)'
                  : 'var(--color-text-secondary)',
                fontSize:       'var(--font-size-xs)',
                fontWeight:     (today || isSelected) ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                cursor:          inMonth ? 'pointer' : 'default',
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            '2px',
                padding:        '2px',
                transition:     'all var(--transition-fast)',
              }}
            >
              {format(day, 'd')}
              {hasAppts && (
                <div style={{
                  width:        4,
                  height:       4,
                  borderRadius: '50%',
                  background:   isSelected ? 'rgba(255,255,255,0.7)' : 'var(--color-accent)',
                  flexShrink:   0,
                }} />
              )}
            </button>
          )
        })}
      </div>

      {selectedDate && (
        <button
          onClick={() => onDateSelect('')}
          style={{
            marginTop:      'var(--space-3)',
            width:          '100%',
            fontSize:       'var(--font-size-xs)',
            color:          'var(--color-text-muted)',
            background:     'none',
            border:         'none',
            cursor:         'pointer',
            textDecoration: 'underline',
          }}
        >
          Mostrar todas las fechas
        </button>
      )}
    </div>
  )
}

function NavBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background:   'transparent',
        border:       '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding:      '4px 8px',
        cursor:       'pointer',
        color:        'var(--color-text-secondary)',
        display:      'flex',
        alignItems:   'center',
        lineHeight:   1,
        transition:   'border-color var(--transition-fast)',
      }}
    >
      {children}
    </button>
  )
}
