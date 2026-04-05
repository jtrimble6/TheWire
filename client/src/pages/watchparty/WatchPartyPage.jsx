import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import { io as socketIO } from 'socket.io-client'
import {
  useGetWatchPartyQuery, useJoinPartyMutation, useStartPartyMutation,
  useEndPartyMutation, useInviteToPartyMutation, useRsvpToPartyMutation
} from '../../store/api/watchPartyApi'
import { useGetMutualFollowersQuery } from '../../store/api/watchlistApi'

export default function WatchPartyPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useSelector((state) => state.auth)

  const { data, refetch } = useGetWatchPartyQuery(id)
  const { data: followersData } = useGetMutualFollowersQuery(undefined, { skip: !isAuthenticated })
  const [joinParty] = useJoinPartyMutation()
  const [startParty] = useStartPartyMutation()
  const [endParty] = useEndPartyMutation()
  const [inviteToParty] = useInviteToPartyMutation()
  const [rsvpToParty] = useRsvpToPartyMutation()

  const [messages, setMessages] = useState([])
  const [msgText, setMsgText] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const chatEndRef = useRef(null)
  const socketRef = useRef(null)
  const seededRef = useRef(false)

  const party = data?.party
  const mutualFollowers = followersData?.users || []

  // Stable refetch callback for socket listeners
  const stableRefetch = useCallback(() => refetch(), [refetch])

  // Join Socket.io party room
  useEffect(() => {
    if (!isAuthenticated || !user?._id) return

    const socket = socketIO(
      process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001',
      { withCredentials: true }
    )
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join_user_room', user._id)
      socket.emit('join_party', id)
    })

    socket.on('party:message', (msg) => {
      setMessages(prev => [...prev, msg])
    })

    socket.on('party:started', () => stableRefetch())
    socket.on('party:ended', () => stableRefetch())
    socket.on('party:participant_joined', () => stableRefetch())
    socket.on('party:participant_left', () => stableRefetch())

    return () => {
      socket.emit('leave_party', id)
      socket.disconnect()
    }
  }, [id, isAuthenticated, user?._id, stableRefetch])

  // Seed existing messages once when party data first loads (only once per party)
  useEffect(() => {
    if (party?.messages && !seededRef.current) {
      setMessages(party.messages)
      seededRef.current = true
    }
  }, [party?._id, party?.messages])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!party) return <div className="detail-loading">Loading watch party...</div>

  const isHost = user?._id === party.hostId?._id
  const isParticipant = party.participants?.some(p => p._id === user?._id)
  const isInvited = party.invites?.some(p => p._id === user?._id)
  const isLive = party.status === 'live'
  const isEnded = party.status === 'ended'
  const scheduled = new Date(party.scheduledAt)

  // Check if expired (24h after start)
  const isExpired = party.expiresAt && new Date(party.expiresAt) < new Date()

  const handleSend = (e) => {
    e.preventDefault()
    if (!msgText.trim() || !isLive || !socketRef.current) return
    socketRef.current.emit('party_message', { partyId: id, text: msgText.trim() })
    setMsgText('')
  }

  const handleInvite = async (userId) => {
    await inviteToParty({ id, userIds: [userId] })
    refetch()
  }

  const uninvited = mutualFollowers.filter(f =>
    !party.invites?.some(i => i._id === f._id) && !party.participants?.some(p => p._id === f._id)
  )

  const recurrenceLabel = {
    daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly'
  }

  return (
    <div className="watch-party-page">
      {/* Header */}
      <div className="wp-header">
        <div className="wp-header-info">
          {party.contentItemId?.posterUrl && (
            <img src={party.contentItemId.posterUrl} alt={party.contentItemId.title} className="wp-poster" />
          )}
          <div>
            <h1 className="wp-title">{party.title}</h1>
            <Link to={`/content/${party.contentItemId?._id}`} className="wp-content-link">
              {party.contentItemId?.title}
            </Link>
            <p className="wp-host">
              Hosted by <Link to={`/user/${party.hostId?.username}`} className="link">{party.hostId?.displayName || party.hostId?.username}</Link>
            </p>
            <div className={`wp-status-badge wp-status--${isExpired ? 'ended' : party.status}`}>
              {isExpired
                ? 'Expired'
                : party.status === 'live'
                  ? '🔴 LIVE'
                  : party.status === 'ended'
                    ? 'Ended'
                    : `Scheduled: ${format(scheduled, 'MMM d, yyyy h:mm a')}`
              }
            </div>
            {party.recurrence && party.recurrence !== 'none' && (
              <span className="wp-recurrence-badge">
                🔁 Recurs {recurrenceLabel[party.recurrence]}
              </span>
            )}
            {party.expiresAt && isLive && !isExpired && (
              <p className="wp-expires-notice">
                Expires {formatDistanceToNow(new Date(party.expiresAt), { addSuffix: true })}
              </p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="wp-controls">
          {isInvited && !isEnded && !isExpired && (
            <>
              <button className="btn-primary" onClick={() => rsvpToParty({ id, action: 'accept' })}>Accept Invite</button>
              <button className="btn-secondary" onClick={() => rsvpToParty({ id, action: 'decline' })}>Decline</button>
            </>
          )}
          {isAuthenticated && !isParticipant && !isInvited && !isEnded && !isExpired && party.isPublic && (
            <button className="btn-primary" onClick={() => joinParty(id)}>Join Party</button>
          )}
          {isHost && party.status === 'scheduled' && !isExpired && (
            <button className="btn-primary" onClick={() => startParty(id)}>Start Party</button>
          )}
          {isHost && isLive && !isExpired && (
            <button className="btn-secondary" onClick={async () => { await endParty(id); navigate('/watch-parties') }}>End Party</button>
          )}
          {isHost && !isEnded && !isExpired && (
            <button className="btn-secondary" onClick={() => setShowInvite(o => !o)}>Invite Friends</button>
          )}
        </div>
      </div>

      {/* Invite panel */}
      {showInvite && (
        <div className="wp-invite-panel">
          <p className="wp-invite-heading">Invite mutual followers</p>
          {uninvited.length === 0 ? (
            <p className="placeholder-text">No more mutual followers to invite.</p>
          ) : (
            uninvited.map(f => (
              <div key={f._id} className="wp-invite-row">
                <span>{f.displayName || f.username}</span>
                <button className="btn-secondary" onClick={() => handleInvite(f._id)}>Invite</button>
              </div>
            ))
          )}
        </div>
      )}

      <div className="wp-body">
        {/* Participants sidebar */}
        <div className="wp-sidebar">
          {/* Live participants */}
          <div className="sidebar-widget">
            <div className="sidebar-widget-header">
              Participants
              <span className="wp-participant-count">{party.participants?.length || 0}</span>
            </div>
            <div className="sidebar-widget-body">
              {(party.participants || []).length === 0 ? (
                <p className="placeholder-text" style={{ fontSize: '0.8rem' }}>No participants yet.</p>
              ) : (
                (party.participants || []).map(p => (
                  <div key={p._id} className="wp-participant">
                    <div className="wp-participant-avatar">
                      {p.avatarUrl
                        ? <img src={p.avatarUrl} alt={p.displayName} />
                        : (p.displayName || p.username || '?')[0].toUpperCase()
                      }
                    </div>
                    <Link to={`/user/${p.username}`} className="link">{p.displayName || p.username}</Link>
                    {p._id === party.hostId?._id && <span className="wp-host-badge">host</span>}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Invited guests (not yet in participants) */}
          <div className="sidebar-widget">
            <div className="sidebar-widget-header">
              Invited
              <span className="wp-participant-count">{party.invites?.length || 0}</span>
            </div>
            <div className="sidebar-widget-body">
              {(party.invites || []).length === 0 ? (
                <p className="placeholder-text" style={{ fontSize: '0.8rem' }}>No pending invites.</p>
              ) : (
                party.invites.map(p => (
                  <div key={p._id} className="wp-participant wp-participant--invited">
                    <div className="wp-participant-avatar">
                      {p.avatarUrl
                        ? <img src={p.avatarUrl} alt={p.displayName} />
                        : (p.displayName || p.username || '?')[0].toUpperCase()
                      }
                    </div>
                    <Link to={`/user/${p.username}`} className="link">{p.displayName || p.username}</Link>
                    <span className="wp-invited-badge">invited</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="wp-chat">
          {!isLive && !isEnded && !isExpired && (
            <div className="wp-chat-placeholder">
              {isPast(scheduled)
                ? 'Waiting for host to start the party...'
                : `Chat opens when the party starts · ${formatDistanceToNow(scheduled, { addSuffix: true })}`
              }
            </div>
          )}

          {(isExpired || isEnded) && !isLive && (
            <div className="wp-chat-placeholder">
              {isExpired ? 'This party has expired.' : 'This party has ended.'}
            </div>
          )}

          {isLive && !isExpired && (
            <>
              <div className="wp-messages">
                {messages.length === 0 && <p className="placeholder-text">No messages yet. Say something!</p>}
                {messages.map((msg, i) => {
                  const msgUserId = msg.userId?._id || msg.userId
                  const isMine = msgUserId === user?._id || msgUserId?.toString() === user?._id
                  return (
                    <div key={msg._id || i} className={`wp-message${isMine ? ' wp-message--mine' : ''}`}>
                      <span className="wp-message-author">
                        {msg.userId?.displayName || msg.userId?.username || 'User'}
                      </span>
                      <span className="wp-message-text">{msg.text}</span>
                      <span className="wp-message-time">
                        {msg.createdAt ? format(new Date(msg.createdAt), 'h:mm a') : ''}
                      </span>
                    </div>
                  )
                })}
                <div ref={chatEndRef} />
              </div>
              {isParticipant && (
                <form className="wp-chat-form" onSubmit={handleSend}>
                  <input
                    value={msgText}
                    onChange={e => setMsgText(e.target.value)}
                    placeholder="Say something..."
                    maxLength={500}
                    className="wp-chat-input"
                    autoComplete="off"
                  />
                  <button type="submit" className="btn-primary" disabled={!msgText.trim()}>Send</button>
                </form>
              )}
              {!isParticipant && isAuthenticated && (
                <p className="wp-chat-observer">Join the party to send messages.</p>
              )}
            </>
          )}

          {/* Show archived messages for ended parties */}
          {(isEnded || isExpired) && messages.length > 0 && (
            <>
              <div className="wp-messages wp-messages--archived">
                <p className="wp-archive-notice">Chat history</p>
                {messages.map((msg, i) => {
                  const msgUserId = msg.userId?._id || msg.userId
                  const isMine = msgUserId === user?._id
                  return (
                    <div key={msg._id || i} className={`wp-message${isMine ? ' wp-message--mine' : ''}`}>
                      <span className="wp-message-author">
                        {msg.userId?.displayName || msg.userId?.username || 'User'}
                      </span>
                      <span className="wp-message-text">{msg.text}</span>
                      <span className="wp-message-time">
                        {msg.createdAt ? format(new Date(msg.createdAt), 'h:mm a') : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
              <p className="wp-ended-notice">This party has ended.</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
