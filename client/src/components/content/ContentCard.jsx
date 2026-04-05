import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useAddToWatchlistMutation } from '../../store/api/watchlistApi'
import { useGetContentMetaQuery } from '../../store/api/contentApi'

const TYPE_LABELS = {
  movie: 'Movie', tv: 'TV Show', music: 'Music',
  album: 'Album', podcast: 'Podcast', youtube: 'YouTube'
}

function decodeHtml(str) {
  if (!str) return str
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(parseInt(c, 10)))
}

export function ratingColorClass(score) {
  if (score >= 8) return 'rating-green'
  if (score >= 6) return 'rating-gold'
  if (score >= 4) return 'rating-orange'
  return 'rating-red'
}

function ContentCardTooltip({ item }) {
  const { data: meta } = useGetContentMetaQuery(item._id)
  const topReviewers = meta?.topReviewers || []

  return (
    <div className="content-card-tooltip">
      {item.description && (
        <p className="tooltip-description">
          {item.description.length > 160 ? item.description.slice(0, 160) + '…' : item.description}
        </p>
      )}
      {item.averageRating > 0 && (
        <div className={`tooltip-rating ${ratingColorClass(item.averageRating)}`}>
          {item.averageRating.toFixed(1)}<span className="tooltip-rating-scale">/10</span>
          <span className="tooltip-rating-count">{item.totalRatings} {item.totalRatings === 1 ? 'rating' : 'ratings'}</span>
        </div>
      )}
      {topReviewers.length > 0 && (
        <div className="tooltip-reviews">
          <div className="tooltip-reviews-label">Top Reviews</div>
          {topReviewers.slice(0, 2).map(r => (
            <div key={r._id} className="tooltip-review">
              <span className="tooltip-review-user">{r.userId?.displayName || r.userId?.username}</span>
              <p className="tooltip-review-body">
                {r.body?.length > 100 ? r.body.slice(0, 100) + '…' : r.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ContentCard({ item }) {
  const navigate = useNavigate()
  const { isAuthenticated } = useSelector((state) => state.auth)
  const [addToWatchlist] = useAddToWatchlistMutation()
  const [hovered, setHovered] = useState(false)

  const handleAdd = async (e) => {
    e.stopPropagation()
    if (!isAuthenticated) return navigate('/login')
    await addToWatchlist({ contentItemId: item._id })
  }

  return (
    <div
      className="content-card-wrap"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="content-card" onClick={() => navigate(`/content/${item._id}`)}>
        <div className="content-card-poster">
          {item.posterUrl
            ? <img src={item.posterUrl} alt={decodeHtml(item.title)} />
            : <div className="content-card-no-image">{decodeHtml(item.title)?.[0]}</div>
          }
          <span className={`content-card-type type--${item.type}`}>{TYPE_LABELS[item.type] || item.type}</span>
          {item.averageRating > 0 && (
            <span className={`content-card-rating-badge ${ratingColorClass(item.averageRating)}`}>
              {item.averageRating.toFixed(1)}
            </span>
          )}
        </div>
        <div className="content-card-info">
          <h3>{decodeHtml(item.title)}</h3>
          <p>{decodeHtml(item.creator)}</p>
        </div>
        <button className="content-card-add" onClick={handleAdd}>+ Watchlist</button>
      </div>
      {hovered && item._id && <ContentCardTooltip item={item} />}
    </div>
  )
}
