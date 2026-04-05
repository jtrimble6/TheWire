import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useGetTrendingQuery } from '../../store/api/contentApi'

const TYPE_LABELS = {
  movie: 'Movie', tv: 'TV', music: 'Music',
  album: 'Album', podcast: 'Podcast', youtube: 'YouTube'
}

const FEATURES = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    title: 'Review Everything',
    desc: 'Rate and review movies, TV shows, music, podcasts, YouTube videos and more — all in one place.'
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Build Your Community',
    desc: "Follow friends, join communities around your favourite genres, and discover what they're watching."
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    title: 'Create Lists',
    desc: 'Curate watchlists and collections. Share them publicly or keep them private for yourself.'
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: 'Watch Parties',
    desc: 'Sync up with friends and host live watch parties with real-time chat and reactions.'
  }
]

function TrendingCard({ item }) {
  return (
    <Link to={`/content/${item._id}`} className="lp-poster-card">
      <div className="lp-poster-card-img-wrap">
        {item.posterUrl
          ? <img src={item.posterUrl} alt={item.title} className="lp-poster-card-img" loading="lazy" />
          : <div className="lp-poster-card-placeholder">{item.title?.[0] || '?'}</div>
        }
        {item.type && (
          <span className={`lp-poster-card-type-badge type-${item.type}`}>
            {TYPE_LABELS[item.type] || item.type}
          </span>
        )}
      </div>
      <p className="lp-poster-card-title">{item.title}</p>
    </Link>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useSelector(state => state.auth)
  const [searchQuery, setSearchQuery] = useState('')
  const { data: trendingData } = useGetTrendingQuery()

  // If already logged in, offer quick link to their home
  const trending = trendingData?.results || trendingData?.items || trendingData || []
  const trendingArray = Array.isArray(trending) ? trending : []

  const handleSearch = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    navigate(`/discover?q=${encodeURIComponent(q)}`)
  }

  return (
    <div className="lp-root">

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div
          className="lp-hero-bg"
          aria-hidden="true"
          style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/hero-bg.png)` }}
        />
        <div className="lp-hero-color-grade" aria-hidden="true" />
        <div className="lp-hero-overlay" aria-hidden="true" />
        <div className="lp-hero-content">
          <h1 className="lp-hero-title">
            The place to discover,<br />track, and share.
          </h1>
          <p className="lp-hero-subtitle">
            Review movies, TV, music, podcasts, and more. Follow friends.
            Join communities. All in one place.
          </p>

          <form className="lp-hero-search" onSubmit={handleSearch} role="search">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies, shows, music, podcasts..."
              aria-label="Search content"
              className="lp-hero-search-input"
            />
            <button type="submit" className="lp-hero-search-btn" aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          </form>

          <div className="lp-hero-cta">
            {isAuthenticated ? (
              <Link to="/home" className="lp-btn-primary">Go to My Dashboard</Link>
            ) : (
              <>
                <Link to="/register" className="lp-btn-primary">Get Started — It's Free</Link>
                <Link to="/login" className="lp-btn-ghost">Sign In</Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Trending ── */}
      {trendingArray.length > 0 && (
        <section className="lp-section">
          <div className="lp-section-header">
            <h2 className="lp-section-title">Trending Now</h2>
            <Link to="/discover" className="lp-section-link">See all</Link>
          </div>
          <div className="lp-carousel" role="list">
            {trendingArray.slice(0, 14).map(item => (
              <div key={item._id} role="listitem">
                <TrendingCard item={item} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Features ── */}
      <section className="lp-features-section">
        <h2 className="lp-features-title">Everything in one place</h2>
        <div className="lp-features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="lp-feature-card">
              <div className="lp-feature-icon">{f.icon}</div>
              <h3 className="lp-feature-name">{f.title}</h3>
              <p className="lp-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Join CTA ── */}
      {!isAuthenticated && (
        <section className="lp-join-section">
          <div className="lp-join-inner">
            <h2 className="lp-join-title">Join TheWire today</h2>
            <p className="lp-join-subtitle">
              Free to join. Start tracking and reviewing in minutes.
            </p>
            <div className="lp-join-cta">
              <Link to="/register" className="lp-btn-primary lp-btn-lg">Create Free Account</Link>
              <Link to="/login" className="lp-btn-ghost">Already have an account?</Link>
            </div>
          </div>
        </section>
      )}

    </div>
  )
}
