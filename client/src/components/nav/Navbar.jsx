import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom'
import { logoutUser } from '../../store/slices/authSlice'
import { useSearchUsersQuery } from '../../store/api/userApi'
import NotificationBell from '../notifications/NotificationBell'

function UserSearchDropdown({ query, onClose }) {
  const { data, isFetching } = useSearchUsersQuery(query, { skip: query.length < 2 })
  const users = data?.users || []

  if (query.length < 2) return null
  if (isFetching) return <div className="user-search-dropdown"><p className="notif-empty">Searching...</p></div>
  if (!users.length) return null

  return (
    <div className="user-search-dropdown">
      {users.map(u => (
        <Link
          key={u._id}
          to={`/user/${u.username}`}
          className="user-search-item"
          onClick={onClose}
        >
          {u.avatarUrl && <img src={u.avatarUrl} alt="" className="notif-avatar" />}
          <div>
            <span className="user-search-name">{u.displayName || u.username}</span>
            <span className="user-search-username"> u/{u.username}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const [searchQuery, setSearchQuery] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileUserSearch, setMobileUserSearch] = useState('')
  const [showMobileUserSearch, setShowMobileUserSearch] = useState(false)
  const searchRef = useRef(null)
  const mobileSearchRef = useRef(null)

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const handleLogout = async () => {
    await dispatch(logoutUser())
    navigate('/login')
    setMenuOpen(false)
  }

  const detectTypeFromQuery = (q) => {
    const signals = [
      { keywords: ['tv show', 'tv series', 'television show'], type: 'tv' },
      { keywords: ['podcast'],                                  type: 'podcast' },
      { keywords: ['movie', 'film'],                            type: 'movie' },
      { keywords: ['song', 'track'],                            type: 'music' },
      { keywords: ['youtube', 'youtuber'],                      type: 'youtube' },
      { keywords: ['album', 'band', 'artist', 'singer'],        type: 'music' },
      { keywords: ['series', 'season', 'episode'],              type: 'tv' },
    ]
    const lower = q.toLowerCase()
    for (const { keywords, type } of signals) {
      for (const kw of keywords) {
        if (new RegExp(`\\b${kw}s?\\b`).test(lower)) return type
      }
    }
    return null
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    const detectedType = detectTypeFromQuery(q)
    const params = new URLSearchParams({ q })
    if (detectedType) params.set('type', detectedType)
    navigate(`/discover?${params.toString()}`)
    setSearchQuery('')
    setMenuOpen(false)
  }

  // Close user search dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowUserSearch(false)
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target)) setShowMobileUserSearch(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const navLinkClass = ({ isActive }) => isActive ? 'nav-link active' : 'nav-link'

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => navigate('/')}>TheWire</div>

        <div className="navbar-search">
          <form onSubmit={handleSearch}>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies, shows, music, podcasts..."
              aria-label="Search content"
            />
            <button type="submit" aria-label="Submit search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          </form>
        </div>

        <div className="navbar-links">
          <NavLink to="/feed" className={navLinkClass}>Feed</NavLink>
          <NavLink to="/discover" className={navLinkClass}>Discover</NavLink>
          <NavLink to="/communities" className={navLinkClass}>Communities</NavLink>
          <NavLink to="/watch-parties" className={navLinkClass}>Watch Parties</NavLink>
        </div>

        <div className="navbar-auth">
          {isAuthenticated ? (
            <>
              <div className="navbar-user-search" ref={searchRef}>
                <input
                  className="navbar-user-search-input"
                  placeholder="Find users..."
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setShowUserSearch(true) }}
                  onFocus={() => setShowUserSearch(true)}
                />
                {showUserSearch && (
                  <UserSearchDropdown
                    query={userSearch}
                    onClose={() => { setShowUserSearch(false); setUserSearch('') }}
                  />
                )}
              </div>
              <NotificationBell />
              <NavLink to="/home" className={navLinkClass}>{user?.displayName || user?.username}</NavLink>
              <button className="nav-logout" onClick={handleLogout}>Sign Out</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navLinkClass}>Sign In</NavLink>
              <NavLink to="/register" className="nav-btn">Sign Up</NavLink>
            </>
          )}
        </div>

        <button
          className={`navbar-burger${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="navbar-mobile-menu">
          <div className="mobile-search">
            <form onSubmit={handleSearch}>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search movies, shows, music, podcasts..."
                aria-label="Search content"
              />
              <button type="submit" aria-label="Submit search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </button>
            </form>
          </div>

          <div className="mobile-nav-links">
            <NavLink to="/feed" className={navLinkClass}>Feed</NavLink>
            <NavLink to="/discover" className={navLinkClass}>Discover</NavLink>
            <NavLink to="/communities" className={navLinkClass}>Communities</NavLink>
            <NavLink to="/watch-parties" className={navLinkClass}>Watch Parties</NavLink>
          </div>

          {isAuthenticated && (
            <div className="mobile-user-search-section" ref={mobileSearchRef}>
              <input
                className="mobile-user-search-input"
                placeholder="Find users..."
                value={mobileUserSearch}
                onChange={(e) => { setMobileUserSearch(e.target.value); setShowMobileUserSearch(true) }}
                onFocus={() => setShowMobileUserSearch(true)}
              />
              {showMobileUserSearch && (
                <UserSearchDropdown
                  query={mobileUserSearch}
                  onClose={() => { setShowMobileUserSearch(false); setMobileUserSearch(''); setMenuOpen(false) }}
                />
              )}
            </div>
          )}

          <div className="mobile-auth">
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <NavLink to="/home" className={navLinkClass}>{user?.displayName || user?.username}</NavLink>
                <button className="nav-logout" onClick={handleLogout}>Sign Out</button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navLinkClass}>Sign In</NavLink>
                <NavLink to="/register" className="nav-btn">Sign Up</NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
