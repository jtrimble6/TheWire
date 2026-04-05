import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { useGetUserActivityQuery } from '../../store/api/activityApi'

const TYPE_CONFIG = {
  rated:        { icon: '⭐', verb: (a) => `rated ${a.contentItem?.title}`, score: true },
  reviewed:     { icon: '✍️', verb: (a) => `reviewed ${a.contentItem?.title}` },
  watchlisted:  { icon: '📋', verb: (a) => `added ${a.contentItem?.title} to watchlist` },
  watched:      { icon: '✅', verb: (a) => `watched ${a.contentItem?.title}` },
  created_list: { icon: '📝', verb: (a) => `created list "${a.list?.title}"` },
  followed:     { icon: '👤', verb: (a) => `followed`, target: true },
  suggested:    { icon: '✨', verb: (a) => `suggested ${a.contentItem?.title} to`, target: true }
}

function ActivityItem({ activity }) {
  const cfg = TYPE_CONFIG[activity.type]
  if (!cfg) return null

  const actor = activity.actor
  const content = activity.contentItem
  const target = activity.targetUser

  return (
    <div className="activity-item">
      <span className="activity-icon" aria-hidden="true">{cfg.icon}</span>
      <div className="activity-body">
        <span className="activity-text">
          <Link to={`/user/${actor?.username}`} className="activity-actor">
            {actor?.displayName || actor?.username}
          </Link>
          {' '}
          {cfg.verb(activity)}
          {cfg.score && activity.score && (
            <span className="activity-score"> ({activity.score}/10)</span>
          )}
          {cfg.target && target && (
            <>
              {' '}
              <Link to={`/user/${target.username}`} className="activity-target">
                {target.displayName || target.username}
              </Link>
            </>
          )}
        </span>
        {content && (
          <Link to={`/content/${content._id}`} className="activity-content-link">
            {content.posterUrl && (
              <img src={content.posterUrl} alt={content.title} className="activity-poster" />
            )}
          </Link>
        )}
        <span className="activity-time">
          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
        </span>
      </div>
    </div>
  )
}

export default function ActivityFeed({ username }) {
  const { data, isLoading, isFetching } = useGetUserActivityQuery({ username, page: 1 })
  const activities = data?.activities || []

  if (isLoading) return <p className="placeholder-text">Loading activity...</p>
  if (!activities.length) return <p className="placeholder-text">No activity yet.</p>

  return (
    <div className="activity-feed">
      {activities.map(a => <ActivityItem key={a._id} activity={a} />)}
      {isFetching && <p className="placeholder-text">Loading more...</p>}
    </div>
  )
}
