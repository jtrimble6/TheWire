import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { useGetMyFeedQuery } from '../../store/api/feedApi'
import { useUpdateProfileMutation, useGetProfileQuery } from '../../store/api/userApi'
import { checkSession } from '../../store/slices/authSlice'
import FeedItem from '../../components/feed/FeedItem'
import WatchlistPanel from '../../components/profile/WatchlistPanel'
import WatchPartyPanel from '../../components/profile/WatchPartyPanel'
import MyCommunityPanel from '../../components/profile/MyCommunityPanel'

function EditProfileModal({ user, onClose }) {
  const dispatch = useDispatch()
  const [updateProfile, { isLoading }] = useUpdateProfileMutation()
  const [form, setForm] = useState({
    displayName: user.displayName || '',
    bio: user.bio || '',
    avatarUrl: user.avatarUrl || ''
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await updateProfile(form).unwrap()
      await dispatch(checkSession())
      onClose()
    } catch {
      setError('Failed to update profile')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Profile</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-field">
            <label>Display Name</label>
            <input
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              placeholder="Your display name"
              maxLength={50}
            />
          </div>
          <div className="modal-field">
            <label>Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell people about yourself..."
              rows={3}
              maxLength={300}
            />
          </div>
          <div className="modal-field">
            <label>Avatar URL</label>
            <input
              value={form.avatarUrl}
              onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
          {form.avatarUrl && (
            <img src={form.avatarUrl} alt="preview" className="avatar-preview" />
          )}
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { user } = useSelector(state => state.auth)
  const { data, isLoading } = useGetMyFeedQuery({})
  const { data: profileData } = useGetProfileQuery(user?.username, { skip: !user?.username })
  const [showEdit, setShowEdit] = useState(false)

  const followerCount = profileData?.user?.followerCount ?? 0
  const followingCount = profileData?.user?.followingCount ?? 0
  const items = data?.docs || []

  return (
    <div className="page-layout">
      <div className="page-main">

        {/* Profile header */}
        <div className="profile-header">
          <div className="profile-avatar">
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt={user.displayName} />
              : <div className="profile-avatar-placeholder">
                  {(user?.displayName || user?.username || '?')[0].toUpperCase()}
                </div>
            }
          </div>
          <div className="profile-info">
            <div className="profile-name-row">
              <div>
                <h1 className="profile-display-name">{user?.displayName || user?.username}</h1>
                <p className="profile-username">u/{user?.username}</p>
              </div>
              <div className="profile-actions">
                <button className="btn-secondary" onClick={() => setShowEdit(true)}>Edit Profile</button>
                <Link to="/lists" className="btn-secondary">My Lists</Link>
              </div>
            </div>
            {user?.bio && <p className="profile-bio">{user.bio}</p>}
            <div className="profile-stats">
              <Link to={`/user/${user?.username}/followers`} className="profile-stat-link">
                <strong>{followerCount}</strong> {followerCount === 1 ? 'follower' : 'followers'}
              </Link>
              <Link to={`/user/${user?.username}/following`} className="profile-stat-link">
                <strong>{followingCount}</strong> following
              </Link>
            </div>
          </div>
        </div>

        {/* Reviews feed */}
        <section>
          <h2 className="section-title">Your Reviews</h2>
          {isLoading ? (
            <p className="placeholder-text">Loading...</p>
          ) : items.length === 0 ? (
            <p className="placeholder-text">
              You haven't reviewed anything yet.{' '}
              <Link to="/discover" className="link">Discover something new!</Link>
            </p>
          ) : (
            <div className="feed-list">
              {items.map(item => <FeedItem key={item._id} item={item} />)}
            </div>
          )}
        </section>

      </div>

      <div className="page-sidebar">
        <WatchlistPanel />
        <WatchPartyPanel currentUserId={user?._id} />
        <MyCommunityPanel />
      </div>

      {showEdit && <EditProfileModal user={user} onClose={() => setShowEdit(false)} />}
    </div>
  )
}
