import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useGetCommentsByReviewQuery, useCreateCommentMutation, useDeleteCommentMutation } from '../../store/api/postApi'
import { formatDistanceToNow } from 'date-fns'

function Comment({ comment, currentUserId, onDelete }) {
  return (
    <div className="comment">
      <div className="comment-header">
        <span className="comment-author">{comment.authorId?.displayName || comment.authorId?.username}</span>
        <span className="comment-time">
          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
        </span>
        {currentUserId === comment.authorId?._id && (
          <button className="comment-delete" onClick={() => onDelete(comment._id)}>✕</button>
        )}
      </div>
      <p className="comment-body">{comment.body}</p>
    </div>
  )
}

export default function CommentThread({ reviewId }) {
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const { data, isLoading } = useGetCommentsByReviewQuery(reviewId)
  const [createComment] = useCreateCommentMutation()
  const [deleteComment] = useDeleteCommentMutation()
  const [body, setBody] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!body.trim()) return
    await createComment({ body, reviewId })
    setBody('')
  }

  const handleDelete = (id) => deleteComment({ id, reviewId })

  if (isLoading) return null

  return (
    <div className="comment-thread">
      <h5>{data?.comments?.length || 0} {data?.comments?.length === 1 ? 'Comment' : 'Comments'}</h5>
      {data?.comments?.map((c) => (
        <Comment
          key={c._id}
          comment={c}
          currentUserId={user?._id}
          onDelete={handleDelete}
        />
      ))}
      {isAuthenticated && (
        <form className="comment-form" onSubmit={handleSubmit}>
          <input
            placeholder="Add a comment..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <button type="submit" disabled={!body.trim()}>Post</button>
        </form>
      )}
    </div>
  )
}
