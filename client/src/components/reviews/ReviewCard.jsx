import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useDeleteReviewMutation } from '../../store/api/reviewApi'
import { formatDistanceToNow } from 'date-fns'
import CommentThread from './CommentThread'
import StarRating from './StarRating'
import ReactionBar from './ReactionBar'

const CommentIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)

export default function ReviewCard({ review, contentItemId }) {
  const { user } = useSelector((state) => state.auth)
  const [deleteReview] = useDeleteReviewMutation()
  const [showComments, setShowComments] = useState(false)
  const [spoilerRevealed, setSpoilerRevealed] = useState(false)

  const isOwner = user?._id === review.userId?._id

  return (
    <div className="review-card">
      <div className="review-card-header">
        <div className="review-author">
          <Link to={`/user/${review.userId?.username}`} className="review-author-name">
            {review.userId?.displayName || review.userId?.username}
          </Link>
          <span className="review-time">
            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
          </span>
        </div>
        {isOwner && (
          <button
            className="review-delete"
            onClick={() => deleteReview({ id: review._id, contentItemId })}
          >
            Delete
          </button>
        )}
      </div>

      {review.rating > 0 && (
        <StarRating value={review.rating} readOnly size="sm" />
      )}

      {review.title && <h4 className="review-title">{review.title}</h4>}

      {review.containsSpoilers && !spoilerRevealed && !isOwner ? (
        <div className="spoiler-warning">
          <p>This review contains spoilers.</p>
          <button className="btn-secondary" onClick={() => setSpoilerRevealed(true)}>Show anyway</button>
        </div>
      ) : (
        <p className="review-body">{review.body}</p>
      )}

      <div className="review-card-footer">
        <ReactionBar reviewId={review._id} />
        <button
          className="review-comment-toggle"
          onClick={() => setShowComments(!showComments)}
          aria-expanded={showComments}
          aria-label={showComments ? 'Hide comments' : 'Show comments'}
        >
          <CommentIcon /> {showComments ? 'Hide' : 'Comments'}
        </button>
      </div>

      {showComments && <CommentThread reviewId={review._id} />}
    </div>
  )
}
