import { useNavigate, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useToggleCommunityPostLikeMutation } from '../../store/api/communityApi'
import { formatDistanceToNow } from 'date-fns'

const HeartIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)

const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
)

export default function CommunityFeedItem({ post }) {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const [toggleLike] = useToggleCommunityPostLikeMutation()

  const community = post.communityId
  const author = post.authorId
  const liked = post.likedBy?.some(id => id === user?._id)

  return (
    <div className="feed-item">
      {/* Like column */}
      <div className="feed-item-vote">
        <button
          className={`feed-item-vote-btn${liked ? ' liked' : ''}`}
          onClick={() => isAuthenticated && community?.slug && toggleLike({ slug: community.slug, postId: post._id })}
          disabled={!isAuthenticated}
          aria-label={liked ? 'Unlike' : 'Like'}
          title={isAuthenticated ? (liked ? 'Unlike' : 'Like') : 'Sign in to like'}
        >
          <HeartIcon filled={liked} />
        </button>
        <span className="feed-item-vote-count">{post.likes || 0}</span>
      </div>

      {/* Community banner placeholder */}
      <div
        className="feed-item-poster-placeholder"
        onClick={() => community?.slug && navigate(`/community/${community.slug}`)}
        role="img"
        aria-label={community?.name || 'Community'}
        style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)', cursor: 'pointer' }}
      >
        {community?.name?.[0]?.toUpperCase() || 'W'}
      </div>

      {/* Body */}
      <div className="feed-item-body">
        <div className="feed-item-meta">
          <span
            className="feed-item-community"
            onClick={() => community?.slug && navigate(`/community/${community.slug}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && community?.slug && navigate(`/community/${community.slug}`)}
          >
            w/{community?.name}
          </span>
          <span className="feed-item-dot">·</span>
          <Link
            className="feed-item-author"
            to={`/user/${author?.username}`}
            onClick={(e) => e.stopPropagation()}
          >
            {author?.displayName || author?.username}
          </Link>
        </div>

        <p className="feed-item-review-body">{post.body}</p>

        <div className="feed-item-actions">
          <button
            className="feed-item-action-btn"
            onClick={() => community?.slug && navigate(`/community/${community.slug}`)}
          >
            <ArrowRightIcon /> View Community
          </button>
          <span className="feed-item-time">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  )
}
