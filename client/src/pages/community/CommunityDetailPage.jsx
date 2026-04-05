import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  useGetCommunityBySlugQuery,
  useGetCommunityPostsQuery,
  useCreateCommunityPostMutation,
  useJoinCommunityMutation,
  useLeaveCommunityMutation,
  useInviteToCommunityMutation
} from '../../store/api/communityApi'
import { useSearchUsersQuery } from '../../store/api/userApi'
import { socket } from '../../utils/socket'
import CommunityPostCard from '../../components/community/CommunityPostCard'

function PostForm({ slug }) {
  const { isAuthenticated } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const [createPost, { isLoading }] = useCreateCommunityPostMutation()
  const [body, setBody] = useState('')
  const [error, setError] = useState('')

  if (!isAuthenticated) {
    return (
      <div className="community-post-form-prompt">
        <button className="btn-primary" onClick={() => navigate('/login')}>
          Sign in to post
        </button>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!body.trim()) return setError('Post cannot be empty')
    setError('')
    try {
      await createPost({ slug, body }).unwrap()
      setBody('')
    } catch {
      setError('Failed to submit post')
    }
  }

  return (
    <form className="community-post-form" onSubmit={handleSubmit}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share something with this community..."
        rows={3}
      />
      {error && <p className="form-error">{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="btn-primary" disabled={isLoading || !body.trim()}>
          {isLoading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  )
}

function InvitePanel({ slug }) {
  const [inviteToCommunity, { isLoading }] = useInviteToCommunityMutation()
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState([]) // array of {_id, username, displayName}
  const [success, setSuccess] = useState('')
  const [err, setErr] = useState('')
  const inputRef = useRef(null)

  const { data: searchData } = useSearchUsersQuery({ q: search }, { skip: search.length < 2 })
  const results = (searchData?.users || []).filter(u => !selected.some(s => s._id === u._id))

  const handleAdd = (user) => {
    setSelected(prev => [...prev, user])
    setInput('')
    setSearch('')
    inputRef.current?.focus()
  }

  const handleRemove = (id) => setSelected(prev => prev.filter(u => u._id !== id))

  const handleSend = async () => {
    if (selected.length === 0) return
    setErr('')
    setSuccess('')
    try {
      await inviteToCommunity({ slug, usernames: selected.map(u => u.username) }).unwrap()
      setSuccess(`Invited ${selected.map(u => u.username).join(', ')}`)
      setSelected([])
    } catch (e) {
      setErr(e.data?.message || 'Failed to send invites')
    }
  }

  return (
    <div className="community-invite-panel">
      <div className="community-invite-input-row">
        <div className="community-invite-tags">
          {selected.map(u => (
            <span key={u._id} className="community-invite-tag">
              {u.username}
              <button type="button" onClick={() => handleRemove(u._id)} className="community-invite-tag-remove">✕</button>
            </span>
          ))}
          <input
            ref={inputRef}
            className="community-invite-input"
            value={input}
            onChange={e => { setInput(e.target.value); setSearch(e.target.value) }}
            placeholder={selected.length === 0 ? 'Search by username…' : ''}
          />
        </div>
      </div>
      {search.length >= 2 && results.length > 0 && (
        <div className="community-invite-dropdown">
          {results.map(u => (
            <button key={u._id} type="button" className="community-invite-option" onClick={() => handleAdd(u)}>
              {u.displayName || u.username} <span className="community-invite-option-sub">u/{u.username}</span>
            </button>
          ))}
        </div>
      )}
      {err && <p className="community-invite-error">{err}</p>}
      {success && <p className="community-invite-success">{success}</p>}
      <button
        className="btn-primary community-invite-send"
        onClick={handleSend}
        disabled={isLoading || selected.length === 0}
      >
        {isLoading ? 'Sending…' : 'Send Invites'}
      </button>
    </div>
  )
}

export default function CommunityDetailPage() {
  const { slug } = useParams()
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const [page, setPage] = useState(1)
  const [liveCount, setLiveCount] = useState(0)

  const { data: communityData, isLoading: communityLoading } = useGetCommunityBySlugQuery(slug)
  const { data: postsData, isLoading: postsLoading, isFetching, refetch } = useGetCommunityPostsQuery({ slug, page })
  const [joinCommunity] = useJoinCommunityMutation()
  const [leaveCommunity] = useLeaveCommunityMutation()

  useEffect(() => {
    socket.connect()
    socket.emit('join_community', slug)
    socket.on('community:new_post', () => setLiveCount(prev => prev + 1))
    return () => {
      socket.emit('leave_community', slug)
      socket.off('community:new_post')
      socket.disconnect()
    }
  }, [slug])

  const handleRefresh = () => {
    setLiveCount(0)
    setPage(1)
    refetch()
  }

  if (communityLoading) return <div className="detail-loading">Loading...</div>
  if (!communityData?.community) return <div className="detail-error">Community not found.</div>

  const { community, isMember, isInvited } = communityData
  const isCreator = user && community.createdBy?._id
    ? String(community.createdBy._id) === String(user._id)
    : community.createdBy?.username === user?.username
  const posts = postsData?.docs || []

  return (
    <div className="page-layout">
      <div className="page-main">
        {/* Community header */}
        <div className="community-detail-header">
          <div className="community-detail-banner">
            {community.bannerUrl
              ? <img src={community.bannerUrl} alt={community.name} />
              : <div className="community-detail-banner-placeholder">{community.name[0].toUpperCase()}</div>
            }
          </div>
          <div className="community-detail-title-row">
            <div>
              <h1>w/{community.name}</h1>
              <p className="community-detail-subtitle">{community.memberCount} {community.memberCount === 1 ? 'member' : 'members'}</p>
            </div>
            {isAuthenticated && isMember && (
              <button className="btn-secondary" onClick={() => leaveCommunity(slug)}>Joined</button>
            )}
            {isAuthenticated && !isMember && (community.isPublic || isInvited) && (
              <button className="btn-primary" onClick={() => joinCommunity(slug)}>
                {isInvited ? 'Accept Invite' : 'Join'}
              </button>
            )}
          </div>
        </div>

        {/* Live banner */}
        {liveCount > 0 && (
          <div className="feed-live-banner">
            🔴 {liveCount} new {liveCount === 1 ? 'post' : 'posts'}
            <button onClick={handleRefresh}>Load new</button>
          </div>
        )}

        {/* Post form */}
        {(community.isPublic || isMember) && <PostForm slug={slug} />}

        {/* Posts list — private communities are members-only */}
        {!community.isPublic && !isMember && !isInvited ? (
          <p className="placeholder-text">Join this community to see posts.</p>
        ) : postsLoading ? (
          <p className="placeholder-text">Loading posts...</p>
        ) : posts.length === 0 ? (
          <p className="placeholder-text">No posts yet — be the first!</p>
        ) : (
          <>
            <div className="community-posts-list">
              {posts.map(post => (
                <CommunityPostCard key={post._id} post={post} slug={slug} />
              ))}
            </div>
            <div className="feed-pagination">
              {page > 1 && (
                <button className="btn-secondary" onClick={() => setPage(p => p - 1)} disabled={isFetching}>
                  ← Previous
                </button>
              )}
              {postsData?.hasNextPage && (
                <button className="btn-secondary" onClick={() => setPage(p => p + 1)} disabled={isFetching}>
                  Next →
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Sidebar */}
      <div className="page-sidebar">
        <div className="sidebar-widget">
          <div className="sidebar-widget-header">About w/{community.name}</div>
          <div className="sidebar-widget-body">
            {community.description
              ? <p className="sidebar-about">{community.description}</p>
              : <p className="sidebar-about">No description yet.</p>
            }
            <div className="sidebar-stat-row">
              <span className="sidebar-stat-label">Members</span>
              <span className="sidebar-stat-value">{community.memberCount}</span>
            </div>
            <div className="sidebar-stat-row">
              <span className="sidebar-stat-label">Type</span>
              <span className="sidebar-stat-value" style={{ textTransform: 'capitalize' }}>{community.type}</span>
            </div>
            <div className="sidebar-stat-row">
              <span className="sidebar-stat-label">Created by</span>
              <span className="sidebar-stat-value">u/{community.createdBy?.username}</span>
            </div>
            <div className="sidebar-stat-row">
              <span className="sidebar-stat-label">Visibility</span>
              <span className={`wp-info-pill ${community.isPublic ? 'wp-pill--public' : 'wp-pill--private'}`}>
                {community.isPublic ? 'Public' : 'Private'}
              </span>
            </div>
          </div>
        </div>

        {isAuthenticated && !isMember && (
          <div className="sidebar-widget">
            <div className="sidebar-widget-body">
              {community.isPublic || isInvited ? (
                <>
                  <p className="sidebar-about">
                    {isInvited
                      ? "You've been invited to this community!"
                      : 'Join this community to participate in discussions.'
                    }
                  </p>
                  <button
                    className="btn-primary"
                    style={{ width: '100%', marginTop: 8 }}
                    onClick={() => joinCommunity(slug)}
                  >
                    {isInvited ? 'Accept Invite' : 'Join Community'}
                  </button>
                </>
              ) : (
                <p className="sidebar-about">This is a private community. You need an invite to join.</p>
              )}
            </div>
          </div>
        )}

        {isAuthenticated && isCreator && (
          <div className="sidebar-widget">
            <div className="sidebar-widget-header">Invite Members</div>
            <div className="sidebar-widget-body">
              <InvitePanel slug={slug} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
