import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useGetCommentsByPostQuery, useCreateCommentMutation, useDeleteCommentMutation } from '../../store/api/postApi'
import { formatDistanceToNow } from 'date-fns'

export default function CommunityPostComments({ postId }) {
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const { data, isLoading } = useGetCommentsByPostQuery(postId)
  const [createComment] = useCreateCommentMutation()
  const [deleteComment] = useDeleteCommentMutation()
  const [body, setBody] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!body.trim()) return
    await createComment({ body, parentId: postId })
    setBody('')
  }

  const handleDelete = (id) => deleteComment({ id, parentId: postId })

  if (isLoading) return null

  const comments = data?.comments || []

  return (
    <div className="comment-thread">
      <h5>{comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}</h5>

      {comments.map(c => (
        <div key={c._id} className="comment">
          <div className="comment-header">
            <span className="comment-author">{c.authorId?.displayName || c.authorId?.username}</span>
            <span className="comment-time">
              {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
            </span>
            {user?._id === c.authorId?._id && (
              <button className="comment-delete" onClick={() => handleDelete(c._id)}>✕</button>
            )}
          </div>
          <p className="comment-body">{c.body}</p>
        </div>
      ))}

      {isAuthenticated ? (
        <form className="comment-form" onSubmit={handleSubmit}>
          <input
            placeholder="Add a comment..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <button type="submit" disabled={!body.trim()}>Post</button>
        </form>
      ) : (
        <button className="btn-secondary" style={{ marginTop: 8, fontSize: '0.8rem' }} onClick={() => navigate('/login')}>
          Sign in to comment
        </button>
      )}
    </div>
  )
}
