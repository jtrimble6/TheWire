import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useGetFollowingFeedQuery, useGetCommunitiesFeedQuery } from '../../store/api/feedApi'
import { useGetTrendingQuery } from '../../store/api/contentApi'
import { socket } from '../../utils/socket'
import FeedItem from '../../components/feed/FeedItem'
import ContentGrid from '../../components/content/ContentGrid'

const PopularIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
)
const FeedIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const CommunitiesIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)

const TABS = [
  { id: 'popular',     label: 'Popular',     Icon: PopularIcon },
  { id: 'following',   label: 'Feed',        Icon: FeedIcon,        authRequired: true },
  { id: 'communities', label: 'Communities', Icon: CommunitiesIcon, authRequired: true }
]

function PaginatedList({ items, hasNextPage, page, setPage, isFetching, emptyMessage, renderItem }) {
  if (!items.length) return <p className="placeholder-text">{emptyMessage}</p>
  return (
    <>
      <div className="feed-list">
        {items.map(item => renderItem(item))}
      </div>
      <div className="feed-pagination">
        {page > 1 && (
          <button className="btn-secondary" onClick={() => setPage(p => p - 1)} disabled={isFetching}>← Previous</button>
        )}
        {hasNextPage && (
          <button className="btn-secondary" onClick={() => setPage(p => p + 1)} disabled={isFetching}>Next →</button>
        )}
      </div>
    </>
  )
}

function PopularFeed() {
  const { data, isLoading } = useGetTrendingQuery()
  const items = data?.items || []

  return (
    <div className="popular-feed">
      <p className="popular-feed-label">Top rated &amp; most reviewed</p>
      <ContentGrid items={items} loading={isLoading} emptyMessage="No rated content yet." />
    </div>
  )
}

function FollowingFeed() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching } = useGetFollowingFeedQuery({ page })

  if (isLoading) return <p className="placeholder-text">Loading...</p>

  return (
    <PaginatedList
      items={data?.docs || []}
      hasNextPage={data?.hasNextPage}
      page={page}
      setPage={setPage}
      isFetching={isFetching}
      emptyMessage="No reviews from people you follow yet. Find people to follow on their profiles or in Communities!"
      renderItem={item => <FeedItem key={item._id} item={item} />}
    />
  )
}

function CommunityRow({ community }) {
  const navigate = useNavigate()
  return (
    <div className="community-feed-row" onClick={() => navigate(`/community/${community.slug}`)}>
      <div className="community-feed-row-banner">
        {community.bannerUrl
          ? <img src={community.bannerUrl} alt={community.name} />
          : <div className="community-feed-row-initial">{community.name[0].toUpperCase()}</div>
        }
      </div>
      <div className="community-feed-row-info">
        <h4>w/{community.name}</h4>
        {community.description && <p>{community.description}</p>}
      </div>
      <div className="community-feed-row-stats">
        <span>{community.memberCount} {community.memberCount === 1 ? 'member' : 'members'}</span>
        <span>{community.postCount || 0} {community.postCount === 1 ? 'post' : 'posts'}</span>
      </div>
    </div>
  )
}

function CommunitiesFeed() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching } = useGetCommunitiesFeedQuery({ page })

  if (isLoading) return <p className="placeholder-text">Loading...</p>

  return (
    <PaginatedList
      items={data?.docs || []}
      hasNextPage={data?.hasNextPage}
      page={page}
      setPage={setPage}
      isFetching={isFetching}
      emptyMessage={<>No communities yet. <Link to="/communities" className="link">Join some communities!</Link></>}
      renderItem={community => <CommunityRow key={community._id} community={community} />}
    />
  )
}

function FeedSidebar() {
  const { isAuthenticated } = useSelector(state => state.auth)
  return (
    <>
      <div className="sidebar-widget">
        <div className="sidebar-widget-header">About TheWire</div>
        <div className="sidebar-widget-body">
          <p className="sidebar-about">
            TheWire is your social hub for reviewing movies, TV shows, music, podcasts, and more.
          </p>
          {!isAuthenticated && (
            <Link to="/register" className="btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>
              Join TheWire
            </Link>
          )}
        </div>
      </div>
      <div className="sidebar-widget">
        <div className="sidebar-widget-header">Quick Links</div>
        <div className="sidebar-widget-body">
          <div className="sidebar-stat-row">
            <span className="sidebar-stat-label">Discover Content</span>
            <Link to="/discover" className="link">Browse →</Link>
          </div>
          <div className="sidebar-stat-row">
            <span className="sidebar-stat-label">Communities</span>
            <Link to="/communities" className="link">Browse →</Link>
          </div>
          {isAuthenticated && (
            <div className="sidebar-stat-row">
              <span className="sidebar-stat-label">Your Profile</span>
              <Link to="/home" className="link">View →</Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function FeedPage() {
  const { isAuthenticated } = useSelector(state => state.auth)
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState('popular')

  const handleTabClick = (t) => {
    if (t.authRequired && !isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return
    }
    setTab(t.id)
  }

  return (
    <div className="page-layout">
      <div className="page-main">
        <div className="feed-page-header">
          <h2>The Wire</h2>
        </div>

        <div className="feed-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`feed-tab-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => handleTabClick(t)}
              aria-selected={tab === t.id}
            >
              <t.Icon />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'popular' && <PopularFeed />}
        {tab === 'following' && <FollowingFeed />}
        {tab === 'communities' && <CommunitiesFeed />}
      </div>

      <div className="page-sidebar">
        <FeedSidebar />
      </div>
    </div>
  )
}
