import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { formatDistanceToNow } from 'date-fns'
import { useGetNotificationsQuery, useMarkNotificationsReadMutation } from '../../store/api/notificationApi'
import { socket } from '../../utils/socket'

function notificationText(n) {
  const actor = n.actor?.displayName || n.actor?.username || 'Someone'
  switch (n.type) {
    case 'like_review': return `${actor} liked your review`
    case 'follow': return `${actor} started following you`
    case 'comment': return `${actor} commented on your post`
    case 'like_post': return `${actor} liked your post`
    case 'watchparty_invite': return `${actor} invited you to a watch party`
    case 'watchparty_start': return `${actor}'s watch party is now live`
    case 'community_invite': return `${actor} invited you to join a community`
    default: return `${actor} interacted with your content`
  }
}

function notificationLink(n) {
  if (n.type === 'follow' && n.actor?.username) return `/user/${n.actor.username}`
  if ((n.type === 'watchparty_invite' || n.type === 'watchparty_start') && n.watchPartyId) {
    return `/watch-party/${n.watchPartyId}`
  }
  if (n.type === 'community_invite' && n.communityId) {
    return `/community/${n.communityId?.slug ?? n.communityId}`
  }
  if (n.reviewId) return `/content/${n.reviewId.contentItemId}`
  return '/feed'
}

export default function NotificationBell() {
  const { user } = useSelector((state) => state.auth)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const { data, refetch } = useGetNotificationsQuery(undefined, { skip: !user })
  const [markRead] = useMarkNotificationsReadMutation()

  const notifications = data?.notifications || []
  const unreadCount = notifications.filter(n => !n.read).length

  // Join user room and listen for real-time notifications
  useEffect(() => {
    if (!user?._id) return
    socket.connect()
    socket.emit('join_user_room', user._id)
    socket.on('notification:new', () => refetch())
    return () => {
      socket.off('notification:new')
      socket.emit('leave_user_room', user._id)
    }
  }, [user?._id, refetch])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => {
    setOpen(o => !o)
    if (!open && unreadCount > 0) markRead()
  }

  if (!user) return null

  return (
    <div className="notif-bell" ref={ref}>
      <button className="notif-bell-btn" onClick={handleOpen} aria-label="Notifications" title="Notifications">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">Notifications</div>
          {notifications.length === 0 ? (
            <p className="notif-empty">No notifications yet</p>
          ) : (
            <div className="notif-list">
              {notifications.map(n => (
                <Link
                  key={n._id}
                  to={notificationLink(n)}
                  className={`notif-item ${!n.read ? 'unread' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  {n.actor?.avatarUrl && (
                    <img src={n.actor.avatarUrl} alt="" className="notif-avatar" />
                  )}
                  <div className="notif-item-body">
                    <span className="notif-text">{notificationText(n)}</span>
                    <span className="notif-time">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
