import { Link } from 'react-router-dom'
import { useGetMyCommunitiesQuery } from '../../store/api/communityApi'

const TYPE_LABELS = { show: 'Show', artist: 'Artist', genre: 'Genre', custom: 'Custom' }

function CommunityRow({ community }) {
  return (
    <Link to={`/community/${community.slug}`} className="my-community-row">
      <div className="my-community-avatar">
        {community.bannerUrl
          ? <img src={community.bannerUrl} alt={community.name} />
          : <span>{community.name[0].toUpperCase()}</span>
        }
      </div>
      <div className="my-community-info">
        <span className="my-community-name">w/{community.name}</span>
        <span className="my-community-meta">
          {community.memberCount} {community.memberCount === 1 ? 'member' : 'members'}
          {' · '}
          <span className={`wp-info-pill ${community.isPublic ? 'wp-pill--public' : 'wp-pill--private'}`}>
            {community.isPublic ? 'Public' : 'Private'}
          </span>
        </span>
      </div>
      {community.type && community.type !== 'custom' && (
        <span className="my-community-type">{TYPE_LABELS[community.type] || community.type}</span>
      )}
    </Link>
  )
}

export default function MyCommunityPanel() {
  const { data, isLoading } = useGetMyCommunitiesQuery()
  const communities = data?.communities || []

  return (
    <div className="sidebar-widget my-community-widget">
      <div className="sidebar-widget-header">My Communities</div>
      <div className="sidebar-widget-body my-community-body">
        {isLoading ? (
          <p className="watchlist-empty">Loading…</p>
        ) : communities.length === 0 ? (
          <p className="watchlist-empty">
            No communities yet.{' '}
            <Link to="/communities" className="link">Browse or create one</Link>
          </p>
        ) : (
          communities.map(c => <CommunityRow key={c._id} community={c} />)
        )}
      </div>
    </div>
  )
}
