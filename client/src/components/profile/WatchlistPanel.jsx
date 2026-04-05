import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  useGetWatchlistQuery,
  useUpdateWatchlistStatusMutation,
  useRemoveFromWatchlistMutation
} from '../../store/api/watchlistApi'

const TABS = [
  { value: 'playing', label: '▶ Playing' },
  { value: 'waiting', label: '⏳ Waiting' },
  { value: 'suggested', label: '✨ Suggested' },
]

export default function WatchlistPanel() {
  const navigate = useNavigate()
  const { data, isLoading } = useGetWatchlistQuery()
  const [updateStatus] = useUpdateWatchlistStatusMutation()
  const [removeItem] = useRemoveFromWatchlistMutation()
  const [activeTab, setActiveTab] = useState('playing')

  const allItems = data?.items || []
  const playing = allItems.filter(e => e.status === 'playing')
  const waiting = allItems.filter(e => e.status === 'waiting')
  const suggested = allItems.filter(e => e.status === 'suggested')

  const tabCounts = { playing: playing.length, waiting: waiting.length, suggested: suggested.length }
  const filtered = activeTab === 'playing' ? playing : activeTab === 'waiting' ? waiting : suggested

  return (
    <div className="sidebar-widget watchlist-widget">
      <div className="sidebar-widget-header">My Watchlist</div>

      <div className="watchlist-tabs">
        {TABS.map(tab => (
          <button
            key={tab.value}
            className={`watchlist-tab ${activeTab === tab.value ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.value)}
          >
            <span className="watchlist-tab-label">{tab.label}</span>
            <span className="watchlist-tab-count">{tabCounts[tab.value]}</span>
          </button>
        ))}
      </div>

      <div className="watchlist-panel-body">
        {isLoading ? (
          <p className="watchlist-empty">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="watchlist-empty">
            {activeTab === 'suggested'
              ? 'No suggestions yet. Mutual followers can suggest content to you.'
              : <>Nothing here. <span className="link" onClick={() => navigate('/discover')}>Discover</span> something!</>
            }
          </p>
        ) : (
          <div className="watchlist-items">
            {filtered.map((entry) => {
              const content = entry.contentItemId
              if (!content) return null
              return (
                <div key={entry._id} className="watchlist-row">
                  <div
                    className="watchlist-row-poster"
                    onClick={() => navigate(`/content/${content._id}`)}
                    title={content.title}
                  >
                    {content.posterUrl
                      ? <img src={content.posterUrl} alt={content.title} />
                      : <div className="watchlist-row-poster-placeholder">{content.title?.[0] || '?'}</div>
                    }
                  </div>
                  <div className="watchlist-row-info">
                    <span
                      className="watchlist-row-title"
                      onClick={() => navigate(`/content/${content._id}`)}
                    >
                      {content.title}
                    </span>
                    {entry.suggestedBy && (
                      <span className="watchlist-row-suggested-by">
                        by <Link to={`/user/${entry.suggestedBy.username}`} className="link">
                          u/{entry.suggestedBy.username}
                        </Link>
                      </span>
                    )}
                    {activeTab === 'suggested' ? (
                      <div className="watchlist-row-actions">
                        <button
                          className="watchlist-accept-btn"
                          onClick={() => updateStatus({ contentItemId: content._id, status: 'playing' })}
                        >
                          ▶ Play
                        </button>
                        <button
                          className="watchlist-accept-btn waiting"
                          onClick={() => updateStatus({ contentItemId: content._id, status: 'waiting' })}
                        >
                          ⏳ Queue
                        </button>
                      </div>
                    ) : (
                      <button
                        className={`watchlist-toggle-btn status-${entry.status}`}
                        onClick={() => updateStatus({
                          contentItemId: content._id,
                          status: entry.status === 'playing' ? 'waiting' : 'playing'
                        })}
                        title={`Move to ${entry.status === 'playing' ? 'Waiting' : 'Playing'}`}
                      >
                        {entry.status === 'playing' ? '→ Waiting' : '→ Playing'}
                      </button>
                    )}
                  </div>
                  <button
                    className="watchlist-row-remove"
                    onClick={() => removeItem(content._id)}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
