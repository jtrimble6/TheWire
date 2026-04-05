import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { format, formatDistanceToNow } from 'date-fns'
import {
  useGetProfileQuery, useGetUserReviewsQuery, useFollowUserMutation,
  useUnfollowUserMutation, useGetSettingsQuery, useUpdateSettingsMutation, useGetUserStatsQuery
} from '../../store/api/userApi'
import { useGetUserListsQuery } from '../../store/api/listApi'
import { useGetMyPartiesQuery, useRsvpToPartyMutation } from '../../store/api/watchPartyApi'
import FeedItem from '../../components/feed/FeedItem'
import ActivityFeed from '../../components/activity/ActivityFeed'

const TABS = ['Reviews', 'Activity', 'Stats', 'Lists', 'Watch Parties', 'Settings']

// ── Settings tab ─────────────────────────────────────────────────────────────

function SettingsTab() {
  const { data: settingsData, isLoading } = useGetSettingsQuery()
  const [updateSettings, { isLoading: saving }] = useUpdateSettingsMutation()
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)

  if (isLoading) return <p className="placeholder-text">Loading settings...</p>

  const s = form || settingsData?.settings || {}

  const set = (key, val) => { setForm(prev => ({ ...s, ...(prev || {}), [key]: val })); setSaved(false) }

  const handleSave = async (e) => {
    e.preventDefault()
    await updateSettings(form || s)
    setSaved(true)
  }

  return (
    <form className="settings-form" onSubmit={handleSave}>
      <h3 className="settings-section-title">Profile</h3>
      <div className="settings-field">
        <label className="settings-label">Display Name</label>
        <input className="settings-input" value={s.displayName || ''} onChange={e => set('displayName', e.target.value)} maxLength={50} />
      </div>
      <div className="settings-field">
        <label className="settings-label">Bio</label>
        <textarea className="settings-textarea" value={s.bio || ''} onChange={e => set('bio', e.target.value)} maxLength={300} rows={3} />
      </div>
      <div className="settings-field">
        <label className="settings-label">Avatar URL</label>
        <input className="settings-input" value={s.avatarUrl || ''} onChange={e => set('avatarUrl', e.target.value)} placeholder="https://..." />
      </div>

      <h3 className="settings-section-title">Privacy</h3>
      <div className="settings-toggle-row">
        <div>
          <span className="settings-toggle-label">Public stats</span>
          <p className="settings-toggle-desc">Allow others to see your watch count, genres, and ratings</p>
        </div>
        <input type="checkbox" className="settings-toggle" checked={s.statsPublic !== false} onChange={e => set('statsPublic', e.target.checked)} />
      </div>
      <div className="settings-toggle-row">
        <div>
          <span className="settings-toggle-label">Public activity</span>
          <p className="settings-toggle-desc">Show your activity feed on your profile</p>
        </div>
        <input type="checkbox" className="settings-toggle" checked={s.activityPublic !== false} onChange={e => set('activityPublic', e.target.checked)} />
      </div>

      <h3 className="settings-section-title">Notifications</h3>
      <div className="settings-toggle-row">
        <div>
          <span className="settings-toggle-label">Email notifications</span>
          <p className="settings-toggle-desc">Receive email updates for follows, reactions, and watch party invites</p>
        </div>
        <input type="checkbox" className="settings-toggle" checked={s.emailNotifications !== false} onChange={e => set('emailNotifications', e.target.checked)} />
      </div>

      <div className="settings-actions">
        <button type="submit" className="btn-primary" disabled={saving || !form}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {saved && <span className="settings-saved">Saved!</span>}
        <Link to="/import" className="btn-secondary">Import from Letterboxd / IMDb</Link>
      </div>
    </form>
  )
}

// ── Stats tab ─────────────────────────────────────────────────────────────────

function StatsTab({ username }) {
  const { data, isLoading } = useGetUserStatsQuery(username)

  if (isLoading) return <p className="placeholder-text">Loading stats...</p>
  if (data?.hidden) return <p className="placeholder-text">This user has made their stats private.</p>

  if (!data) return null

  const maxGenre = Math.max(...(data.genres || []).map(g => g.count), 1)
  const maxRating = Math.max(...(data.ratingDistribution || []).map(r => r.count), 1)

  return (
    <div className="stats-tab">
      {/* Summary cards */}
      <div className="stats-cards">
        <div className="stats-card">
          <span className="stats-card-num">{data.watchedCount}</span>
          <span className="stats-card-label">Watched</span>
        </div>
        <div className="stats-card">
          <span className="stats-card-num">{data.reviewCount}</span>
          <span className="stats-card-label">Reviews</span>
        </div>
        <div className="stats-card">
          <span className="stats-card-num">{data.ratingCount}</span>
          <span className="stats-card-label">Rated</span>
        </div>
      </div>

      {/* Content type breakdown */}
      {Object.keys(data.typeBreakdown || {}).length > 0 && (
        <div className="stats-section">
          <h4 className="stats-section-title">Content Type</h4>
          <div className="stats-types">
            {Object.entries(data.typeBreakdown).map(([type, count]) => (
              <div key={type} className={`stats-type-badge type--${type}`}>
                <span>{type}</span>
                <span className="stats-type-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rating distribution */}
      {data.ratingCount > 0 && (
        <div className="stats-section">
          <h4 className="stats-section-title">Rating Distribution</h4>
          <div className="stats-rating-bars">
            {(data.ratingDistribution || []).map(({ score, count }) => (
              <div key={score} className="stats-bar-row">
                <span className="stats-bar-label">{score}</span>
                <div className="stats-bar-track">
                  <div
                    className="stats-bar-fill"
                    style={{ width: `${Math.round((count / maxRating) * 100)}%` }}
                  />
                </div>
                <span className="stats-bar-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Genre breakdown */}
      {data.genres?.length > 0 && (
        <div className="stats-section">
          <h4 className="stats-section-title">Top Genres</h4>
          <div className="stats-genres">
            {data.genres.map(({ name, count }) => (
              <div key={name} className="stats-genre-row">
                <span className="stats-genre-name">{name}</span>
                <div className="stats-bar-track">
                  <div
                    className="stats-bar-fill stats-bar-fill--genre"
                    style={{ width: `${Math.round((count / maxGenre) * 100)}%` }}
                  />
                </div>
                <span className="stats-bar-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Watch Parties tab ─────────────────────────────────────────────────────────

function PartyCard({ party, type, onRsvp }) {
  const [rsvping, setRsvping] = useState(false)
  const scheduled = new Date(party.scheduledAt)
  const isLive = party.status === 'live'

  const handleRsvp = async (action) => {
    setRsvping(true)
    try { await onRsvp({ id: party._id, action }) } finally { setRsvping(false) }
  }

  return (
    <div className="profile-party-card">
      {party.contentItemId?.posterUrl && (
        <img
          className="profile-party-poster"
          src={party.contentItemId.posterUrl}
          alt={party.contentItemId.title}
        />
      )}
      <div className="profile-party-info">
        <div className="profile-party-title">{party.title}</div>
        <div className="profile-party-content">
          <Link to={`/content/${party.contentItemId?._id}`} className="link">
            {party.contentItemId?.title}
          </Link>
        </div>
        {type === 'invitation' && (
          <div className="profile-party-meta">
            Hosted by{' '}
            <Link to={`/user/${party.hostId?.username}`} className="link">
              {party.hostId?.displayName || party.hostId?.username}
            </Link>
          </div>
        )}
        <div className="profile-party-meta">
          {isLive
            ? <span className="wp-status-badge wp-status--live">LIVE</span>
            : <span className="wp-status-badge wp-status--scheduled">
                {formatDistanceToNow(scheduled, { addSuffix: true })} · {format(scheduled, 'MMM d, h:mm a')}
              </span>
          }
        </div>
      </div>
      <div className="profile-party-actions">
        {type === 'invitation' ? (
          <>
            <button
              className="btn-primary"
              onClick={() => handleRsvp('accept')}
              disabled={rsvping}
            >
              Accept
            </button>
            <button
              className="btn-secondary"
              onClick={() => handleRsvp('decline')}
              disabled={rsvping}
            >
              Decline
            </button>
          </>
        ) : (
          <Link to={`/watch-party/${party._id}`} className="btn-primary">
            {isLive ? 'Join Live' : 'View Party'}
          </Link>
        )}
      </div>
    </div>
  )
}

function WatchPartiesTab({ currentUserId }) {
  const { data, isLoading } = useGetMyPartiesQuery()
  const [rsvpToParty] = useRsvpToPartyMutation()

  if (isLoading) return <p className="placeholder-text">Loading watch parties...</p>

  const parties = data?.parties || []
  const today = new Date(); today.setHours(0, 0, 0, 0)

  const active = parties.filter(p =>
    p.status === 'live' ||
    (p.status === 'scheduled' && new Date(p.scheduledAt) >= today)
  )

  const hosted = active.filter(p => String(p.hostId?._id) === String(currentUserId))
  const invitations = active.filter(p =>
    p.invites?.some(i => String(i._id) === String(currentUserId)) &&
    !p.participants?.some(pa => String(pa._id) === String(currentUserId))
  )
  const attending = active.filter(p =>
    String(p.hostId?._id) !== String(currentUserId) &&
    p.participants?.some(pa => String(pa._id) === String(currentUserId))
  )

  if (hosted.length === 0 && invitations.length === 0 && attending.length === 0) {
    return <p className="placeholder-text">No upcoming watch parties.</p>
  }

  return (
    <div className="profile-parties">
      {invitations.length > 0 && (
        <section className="profile-parties-section">
          <h3 className="profile-parties-section-title">
            Invitations <span className="profile-parties-badge">{invitations.length}</span>
          </h3>
          {invitations.map(p => (
            <PartyCard key={p._id} party={p} type="invitation" onRsvp={rsvpToParty} />
          ))}
        </section>
      )}
      {hosted.length > 0 && (
        <section className="profile-parties-section">
          <h3 className="profile-parties-section-title">Hosting</h3>
          {hosted.map(p => (
            <PartyCard key={p._id} party={p} type="host" onRsvp={rsvpToParty} />
          ))}
        </section>
      )}
      {attending.length > 0 && (
        <section className="profile-parties-section">
          <h3 className="profile-parties-section-title">Attending</h3>
          {attending.map(p => (
            <PartyCard key={p._id} party={p} type="attendee" onRsvp={rsvpToParty} />
          ))}
        </section>
      )}
    </div>
  )
}

// ── Main ProfilePage ──────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user: currentUser, isAuthenticated } = useSelector((state) => state.auth)
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState('Reviews')

  const { data: profileData, isLoading: profileLoading } = useGetProfileQuery(username)
  const { data: reviewsData, isLoading: reviewsLoading, isFetching } = useGetUserReviewsQuery(
    { username, page },
    { skip: activeTab !== 'Reviews' }
  )
  const { data: listsData } = useGetUserListsQuery(profileData?.user?._id, {
    skip: !profileData?.user?._id || activeTab !== 'Lists'
  })
  const [followUser] = useFollowUserMutation()
  const [unfollowUser] = useUnfollowUserMutation()

  if (profileLoading) return <div className="detail-loading">Loading...</div>
  if (!profileData?.user) return <div className="detail-error">User not found.</div>

  const { user, reviewCount, isFollowing, isOwnProfile } = profileData
  const reviews = reviewsData?.docs || []
  const lists = listsData?.lists || []

  const visibleTabs = TABS.filter(t => {
    if (t === 'Settings' || t === 'Watch Parties') return isOwnProfile
    return true
  })

  const handleFollowToggle = () => {
    if (!isAuthenticated) return navigate('/login')
    isFollowing ? unfollowUser(username) : followUser(username)
  }

  return (
    <div className="page-layout">
      <div className="page-main">
        {/* Profile header */}
        <div className="profile-header">
          <div className="profile-avatar">
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt={user.displayName} />
              : <div className="profile-avatar-placeholder">{(user.displayName || user.username)[0].toUpperCase()}</div>
            }
          </div>
          <div className="profile-info">
            <div className="profile-name-row">
              <div>
                <h1 className="profile-display-name">{user.displayName || user.username}</h1>
                <p className="profile-username">u/{user.username}</p>
              </div>
              {isOwnProfile
                ? <button className="btn-secondary" onClick={() => setActiveTab('Settings')}>Edit Profile</button>
                : <button
                    className={isFollowing ? 'btn-secondary' : 'btn-primary'}
                    onClick={handleFollowToggle}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
              }
            </div>
            {user.bio && <p className="profile-bio">{user.bio}</p>}
            <div className="profile-stats">
              <span><strong>{reviewCount}</strong> {reviewCount === 1 ? 'review' : 'reviews'}</span>
              <Link to={`/user/${user.username}/followers`} className="profile-stat-link">
                <strong>{user.followerCount}</strong> {user.followerCount === 1 ? 'follower' : 'followers'}
              </Link>
              <Link to={`/user/${user.username}/following`} className="profile-stat-link">
                <strong>{user.followingCount}</strong> following
              </Link>
              <span className="profile-join-date">Joined {format(new Date(user.joinDate), 'MMMM yyyy')}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs" role="tablist">
          {visibleTabs.map(tab => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              className={`profile-tab${activeTab === tab ? ' profile-tab--active' : ''}`}
              onClick={() => { setActiveTab(tab); setPage(1) }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'Reviews' && (
          reviewsLoading
            ? <p className="placeholder-text">Loading reviews...</p>
            : reviews.length === 0
              ? <p className="placeholder-text">No reviews yet.</p>
              : <>
                  <div className="feed-list">
                    {reviews.map(review => <FeedItem key={review._id} item={review} />)}
                  </div>
                  <div className="feed-pagination">
                    {page > 1 && (
                      <button className="btn-secondary" onClick={() => setPage(p => p - 1)} disabled={isFetching}>← Previous</button>
                    )}
                    {reviewsData?.hasNextPage && (
                      <button className="btn-secondary" onClick={() => setPage(p => p + 1)} disabled={isFetching}>Next →</button>
                    )}
                  </div>
                </>
        )}

        {activeTab === 'Activity' && <ActivityFeed username={username} />}

        {activeTab === 'Stats' && <StatsTab username={username} />}

        {activeTab === 'Lists' && (
          lists.length === 0
            ? <p className="placeholder-text">No lists yet.</p>
            : <div className="profile-lists-grid">
                {lists.map(list => (
                  <Link key={list._id} to={`/lists/${list._id}`} className="profile-list-card">
                    <div className="profile-list-card-previews">
                      {list.items.slice(0, 4).map(item => item.posterUrl && (
                        <img key={item._id} src={item.posterUrl} alt={item.title} className="profile-list-thumb" />
                      ))}
                      {list.items.length === 0 && <div className="profile-list-thumb-placeholder" />}
                    </div>
                    <div className="profile-list-card-info">
                      <span className="profile-list-title">{list.title}</span>
                      <span className="profile-list-meta">
                        {list.items.length} {list.items.length === 1 ? 'item' : 'items'}
                        {' · '}
                        <span className={`list-badge ${list.isPublic ? 'public' : 'private'}`}>
                          {list.isPublic ? 'Public' : 'Private'}
                        </span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
        )}

        {activeTab === 'Watch Parties' && isOwnProfile && <WatchPartiesTab currentUserId={currentUser?._id} />}

        {activeTab === 'Settings' && isOwnProfile && <SettingsTab />}
      </div>

      {/* Sidebar */}
      <div className="page-sidebar">
        <div className="sidebar-widget">
          <div className="sidebar-widget-header">About u/{user.username}</div>
          <div className="sidebar-widget-body">
            {user.bio ? <p className="sidebar-about">{user.bio}</p> : <p className="sidebar-about">No bio yet.</p>}
            <div className="sidebar-stat-row">
              <span className="sidebar-stat-label">Reviews</span>
              <span className="sidebar-stat-value">{reviewCount}</span>
            </div>
            <div className="sidebar-stat-row">
              <span className="sidebar-stat-label">Followers</span>
              <Link to={`/user/${user.username}/followers`} className="sidebar-stat-value sidebar-stat-link">{user.followerCount}</Link>
            </div>
            <div className="sidebar-stat-row">
              <span className="sidebar-stat-label">Following</span>
              <Link to={`/user/${user.username}/following`} className="sidebar-stat-value sidebar-stat-link">{user.followingCount}</Link>
            </div>
            <div className="sidebar-stat-row">
              <span className="sidebar-stat-label">Joined</span>
              <span className="sidebar-stat-value">{format(new Date(user.joinDate), 'MMM yyyy')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
