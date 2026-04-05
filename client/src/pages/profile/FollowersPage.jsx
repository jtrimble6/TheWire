import { Link, useParams } from 'react-router-dom'
import { useGetProfileQuery, useGetFollowersQuery } from '../../store/api/userApi'

function UserRow({ user }) {
  return (
    <Link to={`/user/${user.username}`} className="follow-user-card">
      <div className="follow-user-avatar">
        {user.avatarUrl
          ? <img src={user.avatarUrl} alt={user.displayName || user.username} />
          : <div className="follow-user-avatar-placeholder">{(user.displayName || user.username)[0].toUpperCase()}</div>
        }
      </div>
      <div className="follow-user-info">
        <span className="follow-user-name">{user.displayName || user.username}</span>
        <span className="follow-user-username">u/{user.username}</span>
        {user.bio && <p className="follow-user-bio">{user.bio}</p>}
      </div>
      <span className="follow-user-count">{user.followerCount} {user.followerCount === 1 ? 'follower' : 'followers'}</span>
    </Link>
  )
}

export default function FollowersPage() {
  const { username } = useParams()
  const { data: profileData } = useGetProfileQuery(username)
  const { data, isLoading } = useGetFollowersQuery(username)

  const followers = data?.followers || []

  return (
    <div className="page-layout">
      <div className="page-main">
        <div className="follow-page-header">
          <Link to={`/user/${username}`} className="follow-back-link">← {username}</Link>
          <h2>Followers</h2>
          {profileData?.user && (
            <p className="follow-page-subtitle">{profileData.user.followerCount} {profileData.user.followerCount === 1 ? 'person follows' : 'people follow'} u/{username}</p>
          )}
        </div>

        {isLoading ? (
          <p className="placeholder-text">Loading...</p>
        ) : followers.length === 0 ? (
          <p className="placeholder-text">No followers yet.</p>
        ) : (
          <div className="follow-list">
            {followers.map(user => <UserRow key={user._id} user={user} />)}
          </div>
        )}
      </div>

      <div className="page-sidebar">
        <div className="sidebar-widget">
          <div className="sidebar-widget-header">u/{username}</div>
          <div className="sidebar-widget-body">
            {profileData?.user && (
              <>
                <div className="sidebar-stat-row">
                  <span className="sidebar-stat-label">Followers</span>
                  <span className="sidebar-stat-value">{profileData.user.followerCount}</span>
                </div>
                <div className="sidebar-stat-row">
                  <span className="sidebar-stat-label">Following</span>
                  <Link to={`/user/${username}/following`} className="sidebar-stat-value sidebar-stat-link">{profileData.user.followingCount}</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
