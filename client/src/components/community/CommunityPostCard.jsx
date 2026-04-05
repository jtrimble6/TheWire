import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { formatDistanceToNow } from 'date-fns'
import { useToggleCommunityPostLikeMutation, useDeleteCommunityPostMutation } from '../../store/api/communityApi'
import CommunityPostComments from './CommunityPostComments'

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

export default function CommunityPostCard({ post, slug }) {
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const [toggleLike] = useToggleCommunityPostLikeMutation()
  const [deletePost] = useDeleteCommunityPostMutation()
  const [showComments, setShowComments] = useState(false)

  const liked = post.likedBy?.some(id => id === user?._id)
  const isOwner = user?._id === post.authorId?._id

  return (
    <div className="community-post-card">
      <div className="feed-item-vote">
        <button
          className={`feed-item-vote-btn${liked ? ' liked' : ''}`}
          onClick={() => isAuthenticated && toggleLike({ slug, postId: post._id })}
          disabled={!isAuthenticated}
          aria-label={liked ? 'Unlike' : 'Like'}
          title={isAuthenticated ? (liked ? 'Unlike' : 'Like') : 'Sign in to like'}
        >
          <HeartIcon filled={liked} />
        </button>
        <span className="feed-item-vote-count">{post.likes || 0}</span>
      </div>

      <div className="community-post-body">
        <div className="community-post-meta">
          <Link
            className="feed-item-author"
            to={`/user/${post.authorId?.username}`}
            onClick={(e) => e.stopPropagation()}
          >
            {post.authorId?.displayName || post.authorId?.username}
          </Link>
          <span className="feed-item-dot">·</span>
          <span className="feed-item-time">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </span>
          {isOwner && (
            <button
              className="community-post-delete"
              onClick={() => deletePost({ slug, postId: post._id })}
            >
              Delete
            </button>
          )}
        </div>

        <p className="community-post-text">{post.body}</p>

        <div className="review-card-footer">
          <button
            className="review-comment-toggle"
            onClick={() => setShowComments(s => !s)}
            aria-expanded={showComments}
            aria-label={showComments ? 'Hide comments' : 'Show comments'}
          >
            <CommentIcon /> {showComments ? 'Hide comments' : 'Comments'}
          </button>
        </div>

        {showComments && <CommunityPostComments postId={post._id} />}
      </div>
    </div>
  )
}
