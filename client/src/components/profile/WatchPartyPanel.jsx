import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { format, formatDistanceToNow } from 'date-fns'
import { useGetMyPartiesQuery, useRsvpToPartyMutation, useUpdateWatchPartyMutation } from '../../store/api/watchPartyApi'
import DateTimePicker from '../shared/DateTimePicker'
import { socket } from '../../utils/socket'

const RECURRENCE_OPTIONS = [
  { value: 'none',    label: 'Does not repeat' },
  { value: 'daily',   label: 'Daily' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly',  label: 'Yearly' }
]

function EditForm({ party, onClose }) {
  const [updateWatchParty, { isLoading }] = useUpdateWatchPartyMutation()
  const [title, setTitle] = useState(party.title)
  const [scheduledAt, setScheduledAt] = useState(new Date(party.scheduledAt))
  const [isPublic, setIsPublic] = useState(!!party.isPublic)
  const [recurrence, setRecurrence] = useState(party.recurrence || 'none')
  const [err, setErr] = useState('')

  const handleSave = async (e) => {
    e.preventDefault()
    setErr('')
    try {
      await updateWatchParty({
        id: party._id,
        title: title.trim(),
        scheduledAt: new Date(scheduledAt).toISOString(),
        isPublic,
        recurrence
      }).unwrap()
      onClose()
    } catch {
      setErr('Failed to save changes')
    }
  }

  return (
    <form className="wp-panel-edit-form" onSubmit={handleSave}>
      <div className="wp-panel-edit-field">
        <label className="wp-panel-edit-label">Title</label>
        <input className="wp-panel-edit-input" value={title} onChange={e => setTitle(e.target.value)} maxLength={100} required />
      </div>
      <div className="wp-panel-edit-field">
        <label className="wp-panel-edit-label">Date &amp; Time</label>
        <DateTimePicker
          value={scheduledAt}
          onChange={date => setScheduledAt(date)}
          minDate={new Date()}
        />
      </div>
      <div className="wp-panel-edit-field">
        <label className="wp-panel-edit-label">Repeat</label>
        <select
          className="wp-recurrence-select"
          value={recurrence}
          onChange={e => setRecurrence(e.target.value)}
        >
          {RECURRENCE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <label className="wp-panel-edit-visibility">
        <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
        <span>Public (anyone can join)</span>
      </label>
      {err && <p className="wp-panel-edit-error">{err}</p>}
      <div className="wp-panel-edit-actions">
        <button type="submit" className="btn-primary" disabled={isLoading || !title.trim() || !scheduledAt}>{isLoading ? 'Saving…' : 'Save'}</button>
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
      </div>
    </form>
  )
}

function PartyRow({ party, currentUserId, type }) {
  const [rsvpToParty, { isLoading: rsvping }] = useRsvpToPartyMutation()
  const [editing, setEditing] = useState(false)
  const [showRsvpOptions, setShowRsvpOptions] = useState(false)
  const isLive = party.status === 'live'
  const scheduled = new Date(party.scheduledAt)
  const isHost = String(party.hostId?._id) === String(currentUserId)
  // participants/invites may be raw ObjectIds (unpopulated) or populated objects — handle both
  const isParticipant = party.participants?.some(p => String(p?._id ?? p) === String(currentUserId))
  // Accepted guest: in participants but not the host (they RSVPd yes to an invite)
  const isAcceptedGuest = isParticipant && !isHost
  // Pending invite: in invites, hasn't accepted yet
  const isPending = !isHost && !isParticipant

  const handleAccept = async () => {
    await rsvpToParty({ id: party._id, action: 'accept' })
    setShowRsvpOptions(false)
  }
  const handleDecline = async () => {
    await rsvpToParty({ id: party._id, action: 'decline' })
    setShowRsvpOptions(false)
  }

  return (
    <div className={`wp-panel-row${editing ? ' wp-panel-row--editing' : ''}`}>
      <div className="wp-panel-row-top">
        {party.contentItemId?.posterUrl && (
          <img className="wp-panel-poster" src={party.contentItemId.posterUrl} alt={party.contentItemId.title} />
        )}
        <div className="wp-panel-info">
          <span className="wp-panel-title">{party.title}</span>
          <span className="wp-panel-content">
            <Link to={`/content/${party.contentItemId?._id}`} className="link">{party.contentItemId?.title}</Link>
          </span>
          {!isHost && (
            <span className="wp-panel-host">
              by <Link to={`/user/${party.hostId?.username}`} className="link">{party.hostId?.displayName || party.hostId?.username}</Link>
            </span>
          )}
          <span className="wp-panel-time">
            {formatDistanceToNow(scheduled, { addSuffix: true })} · {format(scheduled, 'MMM d, h:mm a')}
          </span>
          <div className="wp-panel-pills">
            <span className={`wp-info-pill ${party.isPublic ? 'wp-pill--public' : 'wp-pill--private'}`}>
              {party.isPublic ? 'Public' : 'Private'}
            </span>
            {isLive && <span className="wp-info-pill wp-pill--live">Live</span>}
            {isHost && <span className="wp-info-pill wp-pill--host">Host</span>}
            {party.recurrence && party.recurrence !== 'none' && (
              <span className="wp-info-pill wp-pill--recurrence">
                {party.recurrence.charAt(0).toUpperCase() + party.recurrence.slice(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {editing && <EditForm party={party} onClose={() => setEditing(false)} />}

      <div className="wp-panel-actions">
        {isHost ? (
          <>
            <Link to={`/watch-party/${party._id}`} className="btn-primary">{isLive ? 'Join' : 'View'}</Link>
            {!editing && <button className="btn-secondary" onClick={() => setEditing(true)}>Edit</button>}
          </>
        ) : isAcceptedGuest ? (
          <div className="wp-accepted-stack">
            {isLive && (
              <Link to={`/watch-party/${party._id}`} className="btn-primary wp-join-btn">Join</Link>
            )}
            <button
              className={`btn-accepted wp-accepted-btn${showRsvpOptions ? ' open' : ''}`}
              onClick={() => setShowRsvpOptions(o => !o)}
              disabled={rsvping}
            >
              Accepted {showRsvpOptions ? '▲' : '▼'}
            </button>
          </div>
        ) : (
          <button
            className={`btn-secondary wp-rsvp-toggle${showRsvpOptions ? ' active' : ''}`}
            onClick={() => setShowRsvpOptions(o => !o)}
          >
            RSVP {showRsvpOptions ? '▲' : '▼'}
          </button>
        )}
      </div>

      {showRsvpOptions && (isPending || isAcceptedGuest) && (
        <div className="wp-panel-rsvp-options">
          {isPending && (
            <button className="btn-primary" onClick={handleAccept} disabled={rsvping}>
              Accept
            </button>
          )}
          <button className="btn-secondary wp-rsvp-decline" onClick={handleDecline} disabled={rsvping}>
            Decline
          </button>
        </div>
      )}
    </div>
  )
}

export default function WatchPartyPanel({ currentUserId }) {
  const { data, isLoading, refetch } = useGetMyPartiesQuery()
  const [activeTab, setActiveTab] = useState('hosting')

  // Refetch when any watch party the user belongs to goes live or ends
  useEffect(() => {
    const handleNotification = (n) => {
      if (n.type === 'watchparty_start' || n.type === 'watchparty_invite') {
        refetch()
      }
    }
    socket.on('notification:new', handleNotification)
    return () => socket.off('notification:new', handleNotification)
  }, [refetch])

  const parties = data?.parties || []
  const today = new Date(); today.setHours(0, 0, 0, 0)

  const active = parties.filter(p =>
    p.status === 'live' ||
    (p.status === 'scheduled' && new Date(p.scheduledAt) >= today)
  )

  const invitations = active.filter(p =>
    p.invites?.some(i => String(i?._id ?? i) === String(currentUserId)) &&
    !p.participants?.some(pa => String(pa?._id ?? pa) === String(currentUserId))
  )
  const myParties = active.filter(p => !invitations.includes(p))

  return (
    <div className="sidebar-widget wp-panel-widget">
      <div className="sidebar-widget-header">
        Watch Parties
        {invitations.length > 0 && <span className="wp-panel-invite-badge">{invitations.length}</span>}
      </div>

      <div className="wp-panel-tabs">
        <button
          className={`wp-panel-tab${activeTab === 'hosting' ? ' active' : ''}`}
          onClick={() => setActiveTab('hosting')}
        >
          My Parties <span className="wp-panel-tab-count">{myParties.length}</span>
        </button>
        <button
          className={`wp-panel-tab${activeTab === 'invited' ? ' active' : ''}`}
          onClick={() => setActiveTab('invited')}
        >
          Invited
          {invitations.length > 0
            ? <span className="wp-panel-tab-count accent">{invitations.length}</span>
            : <span className="wp-panel-tab-count">{invitations.length}</span>
          }
        </button>
      </div>

      <div className="sidebar-widget-body wp-panel-body">
        {isLoading ? (
          <p className="watchlist-empty">Loading…</p>
        ) : activeTab === 'hosting' ? (
          myParties.length === 0
            ? <p className="watchlist-empty">No upcoming parties. <Link to="/watch-parties" className="link">Create one</Link></p>
            : myParties.map(p => <PartyRow key={p._id} party={p} currentUserId={currentUserId} type="hosting" />)
        ) : (
          invitations.length === 0
            ? <p className="watchlist-empty">No pending invitations.</p>
            : invitations.map(p => <PartyRow key={p._id} party={p} currentUserId={currentUserId} type="invited" />)
        )}
      </div>
    </div>
  )
}
