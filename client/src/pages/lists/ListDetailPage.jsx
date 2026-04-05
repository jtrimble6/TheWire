import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useGetListByIdQuery, useRemoveFromListMutation } from '../../store/api/listApi'
import { useGetMyListRatingQuery, useUpsertListRatingMutation } from '../../store/api/listRatingApi'
import StarRating from '../../components/reviews/StarRating'
import ListCommentThread from '../../components/lists/ListCommentThread'

const TYPE_LABELS = {
  movie: 'Movie', tv: 'TV Show', music: 'Music',
  album: 'Album', podcast: 'Podcast', youtube: 'YouTube'
}

function ratingColor(score) {
  if (!score || score === 0) return 'var(--text-muted)'
  if (score >= 7.5) return '#00c864'
  if (score >= 5) return 'var(--gold)'
  return 'var(--accent)'
}

const TYPE_ORDER = ['movie', 'tv', 'music', 'album', 'podcast', 'youtube']

function ListIndex({ items }) {
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = []
    acc[item.type].push(item)
    return acc
  }, {})
  const types = TYPE_ORDER.filter(t => grouped[t])

  const [open, setOpen] = useState(() => Object.fromEntries(types.map(t => [t, true])))

  const toggle = (t) => setOpen(o => ({ ...o, [t]: !o[t] }))

  return (
    <div className="sidebar-widget">
      <div className="sidebar-widget-header">Index</div>
      <div className="list-index-body">
        {types.map(t => (
          <div key={t} className="list-index-group">
            <button
              className={`list-index-toggle type--${t}`}
              onClick={() => toggle(t)}
            >
              <span>{TYPE_LABELS[t]}</span>
              <span className="list-index-count">{grouped[t].length}</span>
              <span className="list-index-chevron">{open[t] ? '▾' : '▸'}</span>
            </button>
            {open[t] && (
              <ul className="list-index-items">
                {grouped[t].map(item => (
                  <li key={item._id}>
                    <Link to={`/content/${item._id}`} className="list-index-link">
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ListDetailPage() {
  const { id } = useParams()
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const { data, isLoading } = useGetListByIdQuery(id)
  const { data: myRatingData } = useGetMyListRatingQuery(id, { skip: !isAuthenticated })
  const [upsertListRating] = useUpsertListRatingMutation()
  const [removeFromList] = useRemoveFromListMutation()

  if (isLoading) return <div className="detail-loading">Loading...</div>
  if (!data?.list) return <div className="detail-error">List not found.</div>

  const { list } = data
  const isOwner = user?._id === list.owner._id
  const myScore = myRatingData?.rating?.score || 0

  return (
    <div className="page-layout">
      <div className="page-main">
        <div className="list-detail-header">
          <div className="list-detail-title-row">
            <h1 className="list-detail-title">{list.title}</h1>
            {list.averageRating > 0 && (
              <span
                className="list-detail-avg-rating"
                style={{ color: ratingColor(list.averageRating) }}
              >
                ★ {list.averageRating.toFixed(1)}
              </span>
            )}
          </div>
          <p className="list-detail-owner">
            by <Link to={`/user/${list.owner.username}`} className="link">u/{list.owner.username}</Link>
            {' · '}{list.items.length} {list.items.length === 1 ? 'item' : 'items'}
            {' · '}<span className={`list-badge ${list.isPublic ? 'public' : 'private'}`}>{list.isPublic ? 'Public' : 'Private'}</span>
          </p>
          {list.description && <p className="list-detail-desc">{list.description}</p>}

          {isAuthenticated && !isOwner && (
            <div className="list-detail-rating">
              <label className="list-detail-rating-label">Rate this list</label>
              <StarRating
                value={myScore}
                onChange={(score) => upsertListRating({ listId: id, score })}
              />
            </div>
          )}
        </div>

        {list.items.length === 0 ? (
          <p className="placeholder-text">This list is empty. Add content from any content page!</p>
        ) : (
          <div className="list-items-grid">
            {list.items.map(item => (
              <div key={item._id} className="list-item-card">
                <Link to={`/content/${item._id}`} className="list-item-poster-wrap">
                  {item.posterUrl ? (
                    <img src={item.posterUrl} alt={item.title} className="list-item-poster" />
                  ) : (
                    <div className="list-item-poster-placeholder">{item.title[0]}</div>
                  )}
                  <span className={`list-item-type-badge type--${item.type}`}>
                    {TYPE_LABELS[item.type] || item.type}
                  </span>
                </Link>
                <div className="list-item-info">
                  <Link to={`/content/${item._id}`} className="list-item-title">{item.title}</Link>
                  {item.creator && <p className="list-item-creator">{item.creator}</p>}
                  {item.averageRating > 0 && (
                    <p
                      className="list-item-rating"
                      style={{ color: ratingColor(item.averageRating) }}
                    >
                      ★ {item.averageRating.toFixed(1)}
                    </p>
                  )}
                  {isOwner && (
                    <button
                      className="list-remove-btn"
                      onClick={() => removeFromList({ listId: id, itemId: item._id })}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="list-comments-section">
          <div className="profile-section-header">
            <h3>Comments</h3>
          </div>
          <ListCommentThread listId={id} />
        </div>
      </div>

      <div className="page-sidebar">
        <div className="sidebar-widget">
          <div className="sidebar-widget-header">List Info</div>
          <div className="sidebar-widget-body">
            <div className="sidebar-stat-row">
              <span className="sidebar-stat-label">Created by</span>
              <Link to={`/user/${list.owner.username}`} className="link">u/{list.owner.username}</Link>
            </div>
            <div className="sidebar-stat-row">
              <span className="sidebar-stat-label">Items</span>
              <span>{list.items.length}</span>
            </div>
            <div className="sidebar-stat-row">
              <span className="sidebar-stat-label">Visibility</span>
              <span>{list.isPublic ? 'Public' : 'Private'}</span>
            </div>
            {list.averageRating > 0 && (
              <div className="sidebar-stat-row">
                <span className="sidebar-stat-label">Rating</span>
                <span style={{ color: ratingColor(list.averageRating), fontWeight: 700 }}>
                  ★ {list.averageRating.toFixed(1)}
                  <span className="sidebar-rating-count"> ({list.totalRatings})</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {list.items.length > 0 && <ListIndex items={list.items} />}
      </div>
    </div>
  )
}
