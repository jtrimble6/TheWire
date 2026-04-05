import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useCreateReviewMutation } from '../../store/api/reviewApi'
import { useUpsertRatingMutation } from '../../store/api/ratingApi'
import StarRating from './StarRating'

export default function ReviewForm({ contentItemId, initialScore = 0, onSuccess }) {
  const navigate = useNavigate()
  const { isAuthenticated } = useSelector((state) => state.auth)
  const [createReview, { isLoading: reviewLoading }] = useCreateReviewMutation()
  const [upsertRating, { isLoading: ratingLoading }] = useUpsertRatingMutation()

  const [form, setForm] = useState({ title: '', body: '', containsSpoilers: false })
  const [score, setScore] = useState(initialScore)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  // Keep form score in sync with the page-level rating (e.g. user rates from the top first)
  useEffect(() => { setScore(initialScore) }, [initialScore])

  if (!isAuthenticated) {
    return (
      <div className="review-form-prompt">
        <button className="btn-primary" onClick={() => navigate('/login')}>
          Sign in to write a review
        </button>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.body.trim()) return setError('Review body is required')
    setError('')
    try {
      await createReview({ contentItemId, ...form, rating: score || null })
      setForm({ title: '', body: '', containsSpoilers: false })
      setScore(0)
      setOpen(false)
      onSuccess?.()
    } catch {
      setError('Failed to submit review')
    }
  }

  if (!open) {
    return (
      <div className="review-form-prompt">
        <button className="btn-primary" onClick={() => setOpen(true)}>
          Write a Review
        </button>
      </div>
    )
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h3>Write a Review</h3>
      <div className="review-form-rating">
        <label>Your Rating</label>
        <StarRating
          value={score}
          onChange={(s) => {
            setScore(s)
            upsertRating({ contentItemId, score: s })
          }}
        />
      </div>
      <input
        className="review-input"
        placeholder="Review title (optional)"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <textarea
        className="review-textarea"
        placeholder="Share your thoughts..."
        value={form.body}
        onChange={(e) => setForm({ ...form, body: e.target.value })}
        required
        rows={5}
      />
      <label className="review-spoiler-toggle">
        <input
          type="checkbox"
          checked={form.containsSpoilers}
          onChange={(e) => setForm({ ...form, containsSpoilers: e.target.checked })}
        />
        Contains spoilers
      </label>
      {error && <p className="form-error">{error}</p>}
      <div className="review-form-actions">
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={reviewLoading || ratingLoading}>
          {reviewLoading ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </form>
  )
}
