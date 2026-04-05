import { useState, useRef, useEffect, useCallback } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfDay } from 'date-fns'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function generateTimeOptions(interval = 15) {
  const options = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += interval) {
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
      const ampm = h < 12 ? 'AM' : 'PM'
      const label = `${hour12}:${String(m).padStart(2, '0')} ${ampm}`
      const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      options.push({ label, value, h, m })
    }
  }
  return options
}

const TIME_OPTIONS = generateTimeOptions(15)

export default function DateTimePicker({ value, onChange, minDate, placeholder = 'Select date & time', required = false }) {
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(value ? new Date(value) : new Date())
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null)
  const [selectedTime, setSelectedTime] = useState(() => {
    if (value) {
      const d = new Date(value)
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }
    const now = new Date()
    const mins = now.getMinutes() < 30 ? 30 : 0
    const hours = now.getMinutes() < 30 ? now.getHours() : now.getHours() + 1
    return `${String(clamp(hours, 0, 23)).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
  })
  const [popoverStyle, setPopoverStyle] = useState({})
  const triggerRef = useRef(null)
  const popoverRef = useRef(null)

  const today = startOfDay(new Date())
  const effectiveMin = minDate ? startOfDay(new Date(minDate)) : today

  // Position popover using fixed coords to escape any overflow container
  const positionPopover = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const vpH = window.innerHeight
    const popH = 420 // approx popover height
    const spaceBelow = vpH - rect.bottom - 8
    const top = spaceBelow >= popH ? rect.bottom + 6 : Math.max(8, rect.top - popH - 6)
    setPopoverStyle({
      position: 'fixed',
      top,
      left: rect.left,
      width: Math.max(rect.width, 280),
      maxWidth: 320,
      zIndex: 9999
    })
  }, [])

  const handleOpen = () => {
    positionPopover()
    setOpen(o => !o)
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        popoverRef.current && !popoverRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Reposition on scroll/resize while open
  useEffect(() => {
    if (!open) return
    const update = () => positionPopover()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, positionPopover])

  // Sync internal state when value prop changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value)
      setSelectedDate(d)
      setViewMonth(d)
      setSelectedTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
    }
  }, [value])

  const commit = (date, time) => {
    if (!date) return
    const [h, m] = time.split(':').map(Number)
    const combined = new Date(date)
    combined.setHours(h, m, 0, 0)
    onChange(combined)
  }

  const handleDayClick = (day) => {
    if (isBefore(day, effectiveMin)) return
    setSelectedDate(day)
    commit(day, selectedTime)
  }

  const handleTimeChange = (e) => {
    setSelectedTime(e.target.value)
    if (selectedDate) commit(selectedDate, e.target.value)
  }

  // Build calendar grid
  const monthStart = startOfMonth(viewMonth)
  const monthEnd = endOfMonth(viewMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const displayValue = selectedDate
    ? `${format(selectedDate, 'MMM d, yyyy')} at ${TIME_OPTIONS.find(o => o.value === selectedTime)?.label || selectedTime}`
    : ''

  return (
    <div className="dtp-root" ref={triggerRef}>
      <button
        type="button"
        className={`dtp-trigger${open ? ' dtp-trigger--open' : ''}${!displayValue ? ' dtp-trigger--empty' : ''}`}
        onClick={handleOpen}
      >
        <span className="dtp-icon">📅</span>
        <span className="dtp-value">{displayValue || placeholder}</span>
        <span className="dtp-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="dtp-popover" style={popoverStyle} ref={popoverRef}>
          {/* Month navigation */}
          <div className="dtp-month-nav">
            <button type="button" className="dtp-nav-btn" onClick={() => setViewMonth(m => subMonths(m, 1))}>‹</button>
            <span className="dtp-month-label">{format(viewMonth, 'MMMM yyyy')}</span>
            <button type="button" className="dtp-nav-btn" onClick={() => setViewMonth(m => addMonths(m, 1))}>›</button>
          </div>

          {/* Weekday headers */}
          <div className="dtp-weekdays">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="dtp-weekday">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="dtp-days">
            {days.map(day => {
              const outside = !isSameMonth(day, viewMonth)
              const disabled = isBefore(day, effectiveMin)
              const selected = selectedDate && isSameDay(day, selectedDate)
              const todayDay = isToday(day)
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={disabled}
                  className={[
                    'dtp-day',
                    outside ? 'dtp-day--outside' : '',
                    disabled ? 'dtp-day--disabled' : '',
                    selected ? 'dtp-day--selected' : '',
                    todayDay && !selected ? 'dtp-day--today' : ''
                  ].filter(Boolean).join(' ')}
                  onClick={() => handleDayClick(day)}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>

          {/* Time selector */}
          <div className="dtp-time-row">
            <label className="dtp-time-label">Time</label>
            <select className="dtp-time-select" value={selectedTime} onChange={handleTimeChange}>
              {TIME_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Done button */}
          <div className="dtp-footer">
            <button
              type="button"
              className="btn-primary dtp-done-btn"
              disabled={!selectedDate}
              onClick={() => setOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Hidden native input for form validation */}
      <input
        type="hidden"
        value={value ? new Date(value).toISOString() : ''}
        required={required}
      />
    </div>
  )
}
