import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useGetContentByIdQuery, useGetContentMetaQuery, useGetWatchProvidersQuery, useGetRecommendationsQuery } from '../../store/api/contentApi'
import ContentCard from '../../components/content/ContentCard'
import { useGetWatchlistQuery, useAddToWatchlistMutation, useRemoveFromWatchlistMutation, useGetMutualFollowersQuery, useSuggestContentMutation, useMarkWatchedMutation } from '../../store/api/watchlistApi'
import { useCreateWatchPartyMutation } from '../../store/api/watchPartyApi'
import DateTimePicker from '../../components/shared/DateTimePicker'
import { useGetReviewsByContentQuery } from '../../store/api/reviewApi'
import { useGetMyRatingQuery, useUpsertRatingMutation } from '../../store/api/ratingApi'
import { useGetMyListsQuery, useAddToListMutation } from '../../store/api/listApi'
import StarRating from '../../components/reviews/StarRating'
import { ratingColorClass } from '../../components/content/ContentCard'
import ReviewForm from '../../components/reviews/ReviewForm'
import ReviewCard from '../../components/reviews/ReviewCard'

function decodeHtml(str) {
  if (!str) return str
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(parseInt(c, 10)))
}

const PLATFORM_COLORS = {
  Netflix: '#e50914',
  'Disney+': '#113ccf',
  'Hulu': '#1ce783',
  'HBO Max': '#7b2fff',
  'Max': '#7b2fff',
  'Amazon Prime Video': '#00a8e0',
  'Apple TV+': '#555',
  'Peacock': '#ffcb00',
  'Paramount+': '#0064ff',
  Spotify: '#1db954',
  YouTube: '#ff0000'
}

function WhereToPlayModal({ contentId, onClose }) {
  const { data, isLoading, isError } = useGetWatchProvidersQuery(contentId)

  const streaming = data?.streaming || []
  const rent = data?.rent || []
  const buy = data?.buy || []
  const justWatchLink = data?.justWatchLink

  const hasData = streaming.length > 0 || rent.length > 0 || buy.length > 0

  const ProviderRow = ({ provider }) => (
    <a
      href={provider.url || justWatchLink || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="wtp-provider"
      style={{ '--provider-color': PLATFORM_COLORS[provider.name] || 'var(--text-muted)' }}
    >
      {provider.logo
        ? <img src={provider.logo} alt={provider.name} className="wtp-provider-logo" />
        : <div className="wtp-provider-logo-placeholder" style={{ background: PLATFORM_COLORS[provider.name] || 'var(--surface-2)' }}>{provider.name[0]}</div>
      }
      <span className="wtp-provider-name">{provider.name}</span>
      <span className="wtp-provider-arrow">↗</span>
    </a>
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wtp-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>▶ Where to Play</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="wtp-body">
          {isLoading && <p className="wtp-empty">Finding sources...</p>}
          {isError && <p className="wtp-empty">Could not load sources. Try again later.</p>}

          {!isLoading && !isError && !hasData && (
            <p className="wtp-empty">No streaming sources found for your region.<br />
              {justWatchLink && <a href={justWatchLink} target="_blank" rel="noopener noreferrer" className="wtp-justwatch-link">Check JustWatch ↗</a>}
            </p>
          )}

          {streaming.length > 0 && (
            <div className="wtp-section">
              <div className="wtp-section-label">Stream</div>
              {streaming.map(p => <ProviderRow key={p.id} provider={p} />)}
            </div>
          )}

          {rent.length > 0 && (
            <div className="wtp-section">
              <div className="wtp-section-label">Rent</div>
              {rent.map(p => <ProviderRow key={p.id} provider={p} />)}
            </div>
          )}

          {buy.length > 0 && (
            <div className="wtp-section">
              <div className="wtp-section-label">Buy</div>
              {buy.map(p => <ProviderRow key={p.id} provider={p} />)}
            </div>
          )}

          {justWatchLink && hasData && (
            <div className="wtp-footer">
              <a href={justWatchLink} target="_blank" rel="noopener noreferrer" className="wtp-justwatch-link">
                See all options on JustWatch ↗
              </a>
              <span className="wtp-attribution">Powered by JustWatch</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const RECURRENCE_OPTIONS = [
  { value: 'none',    label: 'Does not repeat' },
  { value: 'daily',   label: 'Daily' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly',  label: 'Yearly' }
]

function CreatePartyModal({ contentItemId, contentTitle, onClose, onCreated }) {
  const [createParty, { isLoading }] = useCreateWatchPartyMutation()
  const [title, setTitle] = useState(contentTitle ? `${contentTitle} Watch Party` : '')
  const [scheduledAt, setScheduledAt] = useState(null)
  const [isPublic, setIsPublic] = useState(false)
  const [recurrence, setRecurrence] = useState('none')
  const [err, setErr] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!title.trim() || !scheduledAt) {
      setErr('Please fill in all required fields.')
      return
    }
    try {
      const res = await createParty({
        title: title.trim(),
        contentItemId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        isPublic,
        recurrence
      }).unwrap()
      onCreated(res.party._id)
    } catch (e) {
      setErr(e?.data?.message || 'Failed to create watch party')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Watch Party</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-field">
            <label htmlFor="cp-title">Party Name</label>
            <input
              id="cp-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Friday Night Movie"
              maxLength={100}
              required
            />
          </div>

          <div className="modal-field">
            <label>Date &amp; Time</label>
            <DateTimePicker
              value={scheduledAt}
              onChange={date => setScheduledAt(date)}
              minDate={new Date()}
              placeholder="Pick a date and time"
              required
            />
          </div>

          <div className="modal-field">
            <label htmlFor="cp-recurrence">Repeat</label>
            <select
              id="cp-recurrence"
              className="wp-recurrence-select"
              value={recurrence}
              onChange={e => setRecurrence(e.target.value)}
            >
              {RECURRENCE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {recurrence !== 'none' && (
              <p className="modal-field-hint">
                A new party will be automatically scheduled after each session ends.
              </p>
            )}
          </div>

          <label className="modal-visibility-toggle" htmlFor="cp-public">
            <input
              type="checkbox"
              id="cp-public"
              checked={isPublic}
              onChange={e => setIsPublic(e.target.checked)}
            />
            <span className="modal-visibility-info">
              <span className="modal-visibility-label">Make this party public</span>
              <span className="modal-visibility-hint">Anyone can discover and join public parties</span>
            </span>
            <span className={`list-badge ${isPublic ? 'public' : 'private'}`}>
              {isPublic ? 'Public' : 'Private'}
            </span>
          </label>

          {err && <p className="form-error">{err}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isLoading || !title.trim() || !scheduledAt}>
              {isLoading ? 'Creating…' : 'Create Party'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SuggestDropdown({ contentItemId, onClose }) {
  const { data } = useGetMutualFollowersQuery()
  const [suggestContent] = useSuggestContentMutation()
  const users = data?.users || []

  if (!users.length) {
    return (
      <div className="add-to-list-dropdown">
        <p className="notif-empty">No mutual followers to suggest to.</p>
      </div>
    )
  }

  return (
    <div className="add-to-list-dropdown">
      <p className="add-to-list-heading">Suggest to...</p>
      {users.map(user => (
        <button
          key={user._id}
          className="add-to-list-option"
          onClick={() => { suggestContent({ contentItemId, targetUserId: user._id }); onClose() }}
        >
          {user.displayName || user.username}
          <span className="add-to-list-count">u/{user.username}</span>
        </button>
      ))}
    </div>
  )
}

function AddToListDropdown({ contentItemId, onClose }) {
  const { data } = useGetMyListsQuery()
  const [addToList] = useAddToListMutation()
  const lists = data?.lists || []

  if (!lists.length) {
    return (
      <div className="add-to-list-dropdown">
        <p className="notif-empty">No lists yet. <Link to="/lists" className="link" onClick={onClose}>Create one</Link></p>
      </div>
    )
  }

  return (
    <div className="add-to-list-dropdown">
      <p className="add-to-list-heading">Add to list</p>
      {lists.map(list => (
        <button
          key={list._id}
          className="add-to-list-option"
          onClick={() => { addToList({ listId: list._id, contentItemId }); onClose() }}
        >
          {list.title}
          <span className="add-to-list-count">{list.items.length}</span>
        </button>
      ))}
    </div>
  )
}

function TopReviewCard({ review }) {
  const [spoilerRevealed, setSpoilerRevealed] = useState(false)
  return (
    <div className="top-review-card">
      <div className="top-review-header">
        <Link to={`/user/${review.userId?.username}`} className="link">
          {review.userId?.displayName || review.userId?.username}
        </Link>
        <span className="top-review-likes">{review.likes} likes</span>
      </div>
      {review.title && <p className="top-review-title">{review.title}</p>}
      {review.containsSpoilers && !spoilerRevealed ? (
        <div className="spoiler-warning">
          <p>This review contains spoilers.</p>
          <button className="btn-secondary" onClick={() => setSpoilerRevealed(true)}>Show anyway</button>
        </div>
      ) : (
        <p className="top-review-body">{review.body?.slice(0, 200)}{review.body?.length > 200 ? '…' : ''}</p>
      )}
    </div>
  )
}

export default function ContentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useSelector((state) => state.auth)
  const [reviewSort, setReviewSort] = useState('newest')
  const [showListDropdown, setShowListDropdown] = useState(false)
  const [showSuggestDropdown, setShowSuggestDropdown] = useState(false)
  const [showWhereToPlay, setShowWhereToPlay] = useState(false)
  const [showCreateParty, setShowCreateParty] = useState(false)
  const [markWatched] = useMarkWatchedMutation()

  const { data, isLoading } = useGetContentByIdQuery(id)
  const { data: metaData } = useGetContentMetaQuery(id, { skip: !id })
  const [addToWatchlist] = useAddToWatchlistMutation()
  const [removeFromWatchlist] = useRemoveFromWatchlistMutation()
  const { data: watchlistData } = useGetWatchlistQuery(undefined, { skip: !isAuthenticated })
  const { data: reviewsData, isLoading: reviewsLoading } = useGetReviewsByContentQuery(
    { contentItemId: id, sort: reviewSort },
    { skip: !id }
  )
  const { data: myRatingData } = useGetMyRatingQuery(id, { skip: !isAuthenticated })
  const [upsertRating] = useUpsertRatingMutation()
  const { data: recsData } = useGetRecommendationsQuery(id, { skip: !id })

  if (isLoading) return <div className="detail-loading">Loading...</div>
  if (!data?.item) return <div className="detail-error">Content not found.</div>

  const { item } = data
  const reviews = reviewsData?.docs || []
  const myScore = myRatingData?.rating?.score || 0
  const communities = metaData?.communities || []
  const topReviewers = metaData?.topReviewers || []
  const recommendations = recsData?.results || []
  const isOnWatchlist = isAuthenticated && watchlistData?.items?.some(
    entry => entry.contentItemId?._id === item._id
  )

  return (
    <div className="content-detail">
      <div className="content-detail-hero">
        {item.posterUrl && <img src={item.posterUrl} alt={item.title} className="detail-poster" />}
        <div className="detail-info">
          <h1>{decodeHtml(item.title)}</h1>
          {item.creator && <p className="detail-creator">{decodeHtml(item.creator)}</p>}
          {item.releaseDate && (
            <p className="detail-date">{new Date(item.releaseDate).getFullYear()}</p>
          )}
          {item.genres?.length > 0 && (
            <div className="detail-genres">
              {item.genres.map(g => <span key={g} className="genre-tag">{g}</span>)}
            </div>
          )}
          {item.averageRating > 0 && (
            <p className={`detail-rating ${ratingColorClass(item.averageRating)}`}>
              {item.averageRating.toFixed(1)}<span className="detail-rating-scale">/10</span>
              <span className="rating-count">({item.totalRatings} {item.totalRatings === 1 ? 'rating' : 'ratings'})</span>
            </p>
          )}
          <p className="detail-description">{item.description}</p>

          <div className="detail-actions">
            {isOnWatchlist
              ? <button className="btn-primary watchlist-active" onClick={() => removeFromWatchlist(item._id)}>
                  In Watchlist
                </button>
              : <button className="btn-primary" onClick={() => {
                  if (!isAuthenticated) return navigate('/login')
                  addToWatchlist({ contentItemId: item._id })
                }}>
                  + Watchlist
                </button>
            }

            {isAuthenticated && (
              <div style={{ position: 'relative' }}>
                <button className="btn-secondary" onClick={() => setShowListDropdown(o => !o)}>
                  + Add to List
                </button>
                {showListDropdown && (
                  <AddToListDropdown
                    contentItemId={item._id}
                    onClose={() => setShowListDropdown(false)}
                  />
                )}
              </div>
            )}
            {isAuthenticated && (
              <div style={{ position: 'relative' }}>
                <button className="btn-secondary" onClick={() => setShowSuggestDropdown(o => !o)}>
                  ✨ Suggest
                </button>
                {showSuggestDropdown && (
                  <SuggestDropdown
                    contentItemId={item._id}
                    onClose={() => setShowSuggestDropdown(false)}
                  />
                )}
              </div>
            )}

            <button className="btn-where-to-play" onClick={() => setShowWhereToPlay(true)}>
              ▶ Where to Play
            </button>

            {isAuthenticated && isOnWatchlist && (
              <button className="btn-secondary" onClick={() => markWatched(item._id)}>
                ✅ Mark Watched
              </button>
            )}

            {isAuthenticated && (
              <button className="btn-secondary" onClick={() => setShowCreateParty(true)}>
                🎬 Watch Party
              </button>
            )}
          </div>

          {showWhereToPlay && (
            <WhereToPlayModal contentId={id} onClose={() => setShowWhereToPlay(false)} />
          )}

          {showCreateParty && (
            <CreatePartyModal
              contentItemId={item._id}
              contentTitle={item.title}
              onClose={() => setShowCreateParty(false)}
              onCreated={(partyId) => { setShowCreateParty(false); navigate(`/watch-party/${partyId}`) }}
            />
          )}

          {isAuthenticated && (
            <div className="detail-my-rating">
              <label>Your Rating</label>
              <StarRating
                value={myScore}
                onChange={(score) => upsertRating({ contentItemId: id, score })}
              />
            </div>
          )}
        </div>
      </div>

      {/* Communities discussing this content */}
      {communities.length > 0 && (
        <div className="content-communities">
          <h3 className="content-section-title">Communities</h3>
          <div className="content-community-list">
            {communities.map(c => (
              <Link key={c._id} to={`/community/${c.slug}`} className="content-community-chip">
                w/{c.name}
                <span className="content-community-members">{c.memberCount} members</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Top reviews highlight — top 5 by likes + comments, spoiler-aware */}
      {topReviewers.length > 0 && (() => {
        const top5 = [...topReviewers]
          .sort((a, b) => ((b.likes || 0) + (b.commentCount || 0)) - ((a.likes || 0) + (a.commentCount || 0)))
          .slice(0, 5)
        return (
          <div className="content-top-reviews">
            <h3 className="content-section-title">Top Reviews</h3>
            <div className="top-reviews-list">
              {top5.map(r => <TopReviewCard key={r._id} review={r} />)}
            </div>
          </div>
        )
      })()}

      <div className="detail-reviews">
        <div className="reviews-header">
          <h2>{reviewsData?.totalDocs || 0} {reviewsData?.totalDocs === 1 ? 'Review' : 'Reviews'}</h2>
          <div className="reviews-sort">
            <button
              className={reviewSort === 'newest' ? 'sort-btn active' : 'sort-btn'}
              onClick={() => setReviewSort('newest')}
            >
              Newest
            </button>
            <button
              className={reviewSort === 'top' ? 'sort-btn active' : 'sort-btn'}
              onClick={() => setReviewSort('top')}
            >
              Top
            </button>
          </div>
        </div>

        <ReviewForm contentItemId={id} initialScore={myScore} />

        {reviewsLoading ? (
          <p className="placeholder-text">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="placeholder-text">No reviews yet. Be the first!</p>
        ) : (
          <div className="reviews-list">
            {reviews.map(review => (
              <ReviewCard key={review._id} review={review} contentItemId={id} />
            ))}
          </div>
        )}
      </div>

      {recommendations.length > 0 && (
        <div className="similar-content">
          <h3 className="content-section-title">More Like This</h3>
          <div className="similar-row">
            {recommendations.map(rec => (
              <ContentCard key={rec._id} item={rec} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
