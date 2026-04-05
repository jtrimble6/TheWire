import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSearchContentQuery } from '../../store/api/contentApi'
import ContentGrid from '../../components/content/ContentGrid'

const TYPES = [
  { value: '', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'tv', label: 'TV Shows' },
  { value: 'music', label: 'Music' },
  { value: 'podcast', label: 'Podcasts' },
  { value: 'youtube', label: 'YouTube' },
]

const PLACEHOLDERS = {
  '':        'Search movies, shows, music, podcasts...',
  movie:     'Search movies...',
  tv:        'Search TV shows...',
  music:     'Search music...',
  podcast:   'Search podcasts...',
  youtube:   'Search YouTube...',
}

// Mirror of backend TYPE_SIGNALS (ordered most → least specific)
const TYPE_SIGNALS = [
  { keywords: ['tv show', 'tv series', 'television show'], type: 'tv' },
  { keywords: ['podcast'],                                  type: 'podcast' },
  { keywords: ['movie', 'film'],                            type: 'movie' },
  { keywords: ['song', 'track'],                            type: 'music' },
  { keywords: ['youtube', 'youtuber'],                      type: 'youtube' },
  { keywords: ['album', 'band', 'artist', 'singer'],        type: 'music' },
  { keywords: ['series', 'season', 'episode'],              type: 'tv' },
]

function detectTypeFromQuery(q) {
  const lower = q.toLowerCase()
  for (const { keywords, type } of TYPE_SIGNALS) {
    for (const kw of keywords) {
      if (new RegExp(`\\b${kw}s?\\b`).test(lower)) return type
    }
  }
  return null
}

export default function DiscoverPage() {
  const [searchParams] = useSearchParams()
  const initialQ    = searchParams.get('q')    || ''
  const initialType = searchParams.get('type') || ''

  const [query, setQuery] = useState(initialQ)
  const [type, setType]   = useState(initialType || detectTypeFromQuery(initialQ) || '')
  const [submitted, setSubmitted] = useState(initialQ)
  const [autoDetected, setAutoDetected] = useState(false)

  // Sync when URL params change (e.g. nav search from Navbar)
  useEffect(() => {
    const q = searchParams.get('q')    || ''
    const t = searchParams.get('type') || ''
    setQuery(q)
    const detected = t || detectTypeFromQuery(q) || ''
    setType(detected)
    setAutoDetected(!t && !!detected && !!q)
    setSubmitted(q)
  }, [searchParams])

  // Debounced live search — fires 450ms after user stops typing
  useEffect(() => {
    if (!query.trim()) {
      setSubmitted('')
      return
    }
    const timer = setTimeout(() => setSubmitted(query.trim()), 450)
    return () => clearTimeout(timer)
  }, [query])

  // Auto-detect type as user types in the Discover search bar
  const handleQueryChange = useCallback((e) => {
    const val = e.target.value
    setQuery(val)
    const detected = detectTypeFromQuery(val)
    if (detected) {
      setType(detected)
      setAutoDetected(true)
    } else if (autoDetected) {
      // Clear auto-detected type when keywords are removed
      setType('')
      setAutoDetected(false)
    }
  }, [autoDetected])

  const handleSearch = (e) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setSubmitted(q)
  }

  const handleTypeClick = (value) => {
    setType(value)
    setAutoDetected(false)
  }

  const { data: searchData, isFetching } = useSearchContentQuery(
    { q: submitted, type },
    { skip: !submitted }
  )

  const results = searchData?.results || []
  const activeType = TYPES.find(t => t.value === type)

  const heading = submitted
    ? activeType?.value
      ? `${activeType.label}: results for "${submitted}"`
      : `Results for "${submitted}"`
    : ''

  return (
    <div className="discover-page">
      <h2>Discover</h2>

      <form className="discover-search" onSubmit={handleSearch}>
        <div className="discover-search-input-wrap">
          <input
            value={query}
            onChange={handleQueryChange}
            placeholder={PLACEHOLDERS[type] || PLACEHOLDERS['']}
          />
          {autoDetected && type && (
            <span className="discover-intent-badge">
              {TYPES.find(t => t.value === type)?.label}
            </span>
          )}
        </div>
        <div className="discover-search-row">
          <div className="discover-filters">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`filter-btn${t.value ? ` type--${t.value}` : ''} ${type === t.value ? 'active' : ''}`}
                onClick={() => handleTypeClick(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button type="submit" className="search-btn">Search</button>
        </div>
      </form>

      <div className="discover-results">
        {submitted ? (
          <>
            <h3>{heading}</h3>
            <ContentGrid
              items={results}
              loading={isFetching}
              emptyMessage={`No ${activeType?.label?.toLowerCase() || ''} results for "${submitted}".`.replace('  ', ' ')}
            />
          </>
        ) : (
          <p className="placeholder-text">Search for movies, shows, music, podcasts, and more.</p>
        )}
      </div>
    </div>
  )
}
