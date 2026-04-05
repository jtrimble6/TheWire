import { useSelector } from 'react-redux'
import { useGetReactionsQuery, useToggleReactionMutation } from '../../store/api/reactionApi'

const REACTIONS = [
  { type: 'agree',      label: 'Agree',      emoji: '👍' },
  { type: 'disagree',   label: 'Disagree',   emoji: '👎' },
  { type: 'insightful', label: 'Insightful', emoji: '💡' },
  { type: 'funny',      label: 'Funny',      emoji: '😂' }
]

export default function ReactionBar({ reviewId }) {
  const { isAuthenticated } = useSelector((state) => state.auth)
  const { data } = useGetReactionsQuery(reviewId)
  const [toggleReaction] = useToggleReactionMutation()

  const counts = data?.counts || { agree: 0, disagree: 0, insightful: 0, funny: 0 }
  const myReaction = data?.myReaction || null

  const handleClick = (type) => {
    if (!isAuthenticated) return
    toggleReaction({ reviewId, type })
  }

  return (
    <div className="reaction-bar" role="group" aria-label="Review reactions">
      {REACTIONS.map(({ type, label, emoji }) => {
        const count = counts[type] || 0
        const active = myReaction === type
        return (
          <button
            key={type}
            className={`reaction-btn${active ? ' reaction-btn--active' : ''}`}
            onClick={() => handleClick(type)}
            disabled={!isAuthenticated}
            aria-pressed={active}
            aria-label={`${label}: ${count}`}
            title={isAuthenticated ? label : 'Log in to react'}
          >
            <span className="reaction-emoji" aria-hidden="true">{emoji}</span>
            {count > 0 && <span className="reaction-count">{count}</span>}
          </button>
        )
      })}
    </div>
  )
}
