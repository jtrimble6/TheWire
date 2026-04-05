import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useToggleReviewLikeMutation } from '../../store/api/reviewApi'
import { useGetWatchlistQuery, useAddToWatchlistMutation, useRemoveFromWatchlistMutation } from '../../store/api/watchlistApi'
import { formatDistanceToNow } from 'date-fns'
import StarRating from '../reviews/StarRating'

const TYPE_LABELS = {
  movie: 'Movie', tv: 'TV', music: 'Music',
  album: 'Album', podcast: 'Podcast', youtube: 'YouTube'
}

const HeartIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)

const CommentIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const WarningIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

export default function FeedItem({ item }) {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const [toggleLike] = useToggleReviewLikeMutation()
  const [addToWatchlist] = useAddToWatchlistMutation()
  const [removeFromWatchlist] = useRemoveFromWatchlistMutation()
  const { data: watchlistData } = useGetWatchlistQuery(undefined, { skip: !isAuthenticated })

  const serverLiked = item.likedBy?.some(id => id === user?._id)
  const [localLiked, setLocalLiked] = useState(null)
  const [localLikes, setLocalLikes] = useState(item.likes || 0)
  const liked = localLiked !== null ? localLiked : serverLiked

  const content = item.contentItemId
  const author = item.userId

  const isOnWatchlist = isAuthenticated && watchlistData?.items?.some(
    entry => entry.contentItemId?._id === content?._id
  )

  const goToContent = () => content?._id && navigate(`/content/${content._id}`)

  const handleLike = () => {
    if (!isAuthenticated) return
    const next = !liked
    setLocalLiked(next)
    setLocalLikes(l => next ? l + 1 : Math.max(0, l - 1))
    toggleLike(item._id)
  }

  return (
    <div className="feed-item">
      {/* Like column */}
      <div className="feed-item-vote">
        <button
          className={`feed-item-vote-btn${liked ? ' liked' : ''}`}
          onClick={handleLike}
          disabled={!isAuthenticated}
          aria-label={liked ? 'Unlike' : 'Like'}
          title={isAuthenticated ? (liked ? 'Unlike' : 'Like') : 'Sign in to like'}
        >
          <HeartIcon filled={liked} />
        </button>
        <span className="feed-item-vote-count">{localLikes}</span>
      </div>

      {/* Poster */}
      {content?.posterUrl
        ? <img src={content.posterUrl} alt={content?.title} className="feed-item-poster" onClick={goToContent} />
        : <div className="feed-item-poster-placeholder" onClick={goToContent} role="img" aria-label={content?.title || 'No image'}>
            {content?.title?.[0] || '?'}
          </div>
      }

      {/* Body */}
      <div className="feed-item-body">
        <div className="feed-item-meta">
          <Link
            className="feed-item-author"
            to={`/user/${author?.username}`}
            onClick={(e) => e.stopPropagation()}
          >
            {author?.displayName || author?.username}
          </Link>
          <span className="feed-item-dot">·</span>
          <span>reviewed</span>
          <span className="feed-item-dot">·</span>
          <span className="feed-item-content-title" onClick={goToContent}>
            {content?.title}
          </span>
          {content?.type && (
            <span className="feed-item-type">{TYPE_LABELS[content.type] || content.type}</span>
          )}
        </div>

        {item.rating > 0 && (
          <StarRating value={item.rating} readOnly size="sm" />
        )}

        {item.title && <h4 className="feed-item-review-title">{item.title}</h4>}

        {item.containsSpoilers && item.userId?._id !== user?._id ? (
          <p className="feed-item-spoiler">
            <WarningIcon /> Contains spoilers
          </p>
        ) : (
          <p className="feed-item-review-body">{item.body}</p>
        )}

        <div className="feed-item-actions">
          <button className="feed-item-action-btn" onClick={goToContent}>
            <CommentIcon /> Comments
          </button>
          {isAuthenticated && content?._id && (
            isOnWatchlist
              ? <button
                  className="feed-item-action-btn watchlist-active"
                  onClick={() => removeFromWatchlist(content._id)}
                >
                  <CheckIcon /> Watchlist
                </button>
              : <button
                  className="feed-item-action-btn"
                  onClick={() => addToWatchlist({ contentItemId: content._id })}
                >
                  <PlusIcon /> Watchlist
                </button>
          )}
          <span className="feed-item-time">
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  )
}
