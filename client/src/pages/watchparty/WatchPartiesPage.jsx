import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { format, formatDistanceToNow } from 'date-fns'
import { useGetPublicPartiesQuery, useCreateWatchPartyMutation } from '../../store/api/watchPartyApi'
import { useGetWatchlistQuery } from '../../store/api/watchlistApi'
import DateTimePicker from '../../components/shared/DateTimePicker'

const RECURRENCE_OPTIONS = [
  { value: 'none',    label: 'Does not repeat' },
  { value: 'daily',   label: 'Daily' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly',  label: 'Yearly' }
]

// ── Create Watch Party Modal ─────────────────────────────────────────────────

function CreatePartyModal({ onClose }) {
  const navigate = useNavigate()
  const { data: watchlistData } = useGetWatchlistQuery()
  const [createWatchParty, { isLoading }] = useCreateWatchPartyMutation()

  const allItems = watchlistData?.items || []
  const contentOptions = allItems.filter(e => ['playing', 'waiting', 'suggested'].includes(e.status))

  const [selectedContent, setSelectedContent] = useState(null)
  const [title, setTitle] = useState('')
  const [scheduledAt, setScheduledAt] = useState(null)
  const [isPublic, setIsPublic] = useState(false)
  const [recurrence, setRecurrence] = useState('none')
  const [err, setErr] = useState('')
  const [step, setStep] = useState(1)

  const handleSelectContent = (entry) => {
    setSelectedContent(entry)
    setTitle(`${entry.contentItemId?.title || ''} Watch Party`)
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!selectedContent || !title.trim() || !scheduledAt) {
      setErr('Please fill in all required fields.')
      return
    }
    try {
      const result = await createWatchParty({
        title: title.trim(),
        contentItemId: selectedContent.contentItemId._id,
        scheduledAt: new Date(scheduledAt).toISOString(),
        isPublic,
        recurrence
      }).unwrap()
      onClose()
      navigate(`/watch-party/${result.party._id}`)
    } catch (e) {
      setErr(e?.data?.message || 'Failed to create watch party')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wp-create-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{step === 1 ? 'Choose Content' : 'Party Details'}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {step === 1 && (
          <div className="wp-create-content-picker">
            {contentOptions.length === 0 ? (
              <div className="wp-create-empty">
                <p>Your watchlist is empty.</p>
                <p><Link to="/discover" className="link" onClick={onClose}>Discover content</Link> and add it to your watchlist first.</p>
              </div>
            ) : (
              <div className="wp-create-content-list">
                {contentOptions.map(entry => {
                  const c = entry.contentItemId
                  if (!c) return null
                  return (
                    <button
                      key={entry._id}
                      className="wp-create-content-item"
                      onClick={() => handleSelectContent(entry)}
                    >
                      {c.posterUrl
                        ? <img src={c.posterUrl} alt={c.title} className="wp-create-content-poster" />
                        : <div className="wp-create-content-poster wp-create-poster-placeholder">{c.title?.[0]}</div>
                      }
                      <div className="wp-create-content-info">
                        <span className="wp-create-content-title">{c.title}</span>
                        <span className="wp-create-content-meta">
                          <span className={`type-badge type--${c.type}`}>{c.type}</span>
                          {entry.status === 'suggested' && <span className="wp-create-suggested-badge">Suggested</span>}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {step === 2 && selectedContent && (
          <form className="modal-form" onSubmit={handleSubmit}>
            {/* Selected content preview */}
            <div className="wp-create-selected">
              {selectedContent.contentItemId?.posterUrl && (
                <img src={selectedContent.contentItemId.posterUrl} alt="" className="wp-create-selected-poster" />
              )}
              <div>
                <span className="wp-create-selected-title">{selectedContent.contentItemId?.title}</span>
                <button type="button" className="wp-create-change-btn" onClick={() => setStep(1)}>Change</button>
              </div>
            </div>

            <div className="modal-field">
              <label htmlFor="wp-title">Party Name</label>
              <input
                id="wp-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={100}
                required
              />
            </div>

            <div className="modal-field">
              <label>Date &amp; Time</label>
              <DateTimePicker
                value={scheduledAt}
                onChange={date => setScheduledAt(date)}
                minDate={new Date()}
                placeholder="Pick a date and time"
                required
              />
            </div>

            <div className="modal-field">
              <label htmlFor="wp-recurrence">Repeat</label>
              <select
                id="wp-recurrence"
                className="wp-recurrence-select"
                value={recurrence}
                onChange={e => setRecurrence(e.target.value)}
              >
                {RECURRENCE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {recurrence !== 'none' && (
                <p className="modal-field-hint">
                  A new party will be automatically scheduled after each session ends.
                </p>
              )}
            </div>

            <label className="modal-visibility-toggle" htmlFor="wp-public">
              <input
                type="checkbox"
                id="wp-public"
                checked={isPublic}
                onChange={e => setIsPublic(e.target.checked)}
              />
              <span className="modal-visibility-info">
                <span className="modal-visibility-label">Make this party public</span>
                <span className="modal-visibility-hint">Anyone can discover and join public parties</span>
              </span>
              <span className={`list-badge ${isPublic ? 'public' : 'private'}`}>
                {isPublic ? 'Public' : 'Private'}
              </span>
            </label>

            {err && <p className="form-error">{err}</p>}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setStep(1)}>Back</button>
              <button type="submit" className="btn-primary" disabled={isLoading || !title.trim() || !scheduledAt}>
                {isLoading ? 'Creating…' : 'Create Party'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Public Party Card ─────────────────────────────────────────────────────────

function PublicPartyCard({ party }) {
  const isLive = party.status === 'live'
  const scheduled = new Date(party.scheduledAt)

  return (
    <Link to={`/watch-party/${party._id}`} className="wp-discover-card">
      <div className="wp-discover-card-poster">
        {party.contentItemId?.posterUrl
          ? <img src={party.contentItemId.posterUrl} alt={party.contentItemId.title} />
          : <div className="wp-discover-poster-placeholder">{party.title?.[0]}</div>
        }
        {isLive && <span className="wp-discover-live-badge">LIVE</span>}
        {party.recurrence && party.recurrence !== 'none' && (
          <span className="wp-discover-recur-badge" title={`Recurs ${party.recurrence}`}>🔁</span>
        )}
      </div>
      <div className="wp-discover-card-info">
        <p className="wp-discover-card-title">{party.title}</p>
        <p className="wp-discover-card-content">{party.contentItemId?.title}</p>
        <div className="wp-discover-card-meta">
          <span className="wp-discover-host">
            by <strong>{party.hostId?.displayName || party.hostId?.username}</strong>
          </span>
          <span className="wp-discover-time">
            {isLive ? 'Live now' : formatDistanceToNow(scheduled, { addSuffix: true })}
          </span>
        </div>
        <div className="wp-discover-card-footer">
          <span className="wp-discover-participants">
            {party.participants?.length || 0} joined
          </span>
          <span className="wp-discover-date">{format(scheduled, 'MMM d, h:mm a')}</span>
        </div>
      </div>
    </Link>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function WatchPartiesPage() {
  const { isAuthenticated } = useSelector(state => state.auth)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(debounceRef.current)
  }, [search])

  const { data, isLoading, isFetching } = useGetPublicPartiesQuery(debouncedSearch)
  const parties = data?.parties || []

  return (
    <div className="page-layout">
      <div className="page-main">
        <div className="wp-discover-header">
          <div>
            <h1 className="wp-discover-title">Watch Parties</h1>
            <p className="wp-discover-subtitle">Join a public party or host your own</p>
          </div>
          {isAuthenticated && (
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              + Create Party
            </button>
          )}
        </div>

        <div className="wp-discover-search">
          <input
            className="wp-discover-search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search public watch parties..."
            aria-label="Search watch parties"
          />
          {(isLoading || isFetching) && <span className="wp-discover-searching">Searching…</span>}
        </div>

        {!isLoading && parties.length === 0 ? (
          <div className="wp-discover-empty">
            <p>{debouncedSearch ? `No public parties found for "${debouncedSearch}"` : 'No public watch parties scheduled yet.'}</p>
            {isAuthenticated && (
              <button className="btn-primary" onClick={() => setShowCreate(true)}>Be the first — Create a Party</button>
            )}
          </div>
        ) : (
          <div className="wp-discover-grid">
            {parties.map(p => <PublicPartyCard key={p._id} party={p} />)}
          </div>
        )}
      </div>

      <div className="page-sidebar">
        <div className="sidebar-widget">
          <div className="sidebar-widget-header">About Watch Parties</div>
          <div className="sidebar-widget-body">
            <p className="sidebar-about">Watch together with friends. Create a party from your watchlist, invite friends, and chat in real time.</p>
            {isAuthenticated && (
              <button className="btn-primary" style={{ width: '100%', marginTop: '12px' }} onClick={() => setShowCreate(true)}>
                + Create a Watch Party
              </button>
            )}
          </div>
        </div>
      </div>

      {showCreate && <CreatePartyModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
