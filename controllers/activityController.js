const { Activity, User } = require('../models')

const POPULATE = [
  { path: 'actor', select: 'username displayName avatarUrl' },
  { path: 'contentItem', select: 'title type posterUrl' },
  { path: 'targetUser', select: 'username displayName' },
  { path: 'review', select: 'title body' },
  { path: 'list', select: 'title' }
]

/**
 * GET /api/activity/:username
 * Returns the activity feed for a specific user's profile.
 * Suggestions are hidden unless the viewer is the profile owner.
 */
exports.getUserActivity = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const user = await User.findOne({ username: req.params.username }, '_id settings')
    if (!user) return res.status(404).json({ message: 'User not found' })

    const isOwn = req.user?._id.toString() === user._id.toString()

    // Respect activityPublic setting for non-owners
    if (!isOwn && user.settings?.activityPublic === false) {
      return res.json({ activities: [], hasMore: false })
    }

    const filter = { actor: user._id }
    // Hide suggestions from public view (only owner sees their own suggestions)
    if (!isOwn) filter.type = { $ne: 'suggested' }

    const skip = (Number(page) - 1) * Number(limit)
    const [activities, total] = await Promise.all([
      Activity.find(filter).populate(POPULATE).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Activity.countDocuments(filter)
    ])

    res.json({ activities, hasMore: skip + activities.length < total, total })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/**
 * GET /api/activity/feed
 * Returns activity from users the current user follows.
 */
exports.getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query
    const me = await User.findById(req.user._id, 'following')
    const ids = [...me.following, req.user._id]

    const skip = (Number(page) - 1) * Number(limit)
    const [activities, total] = await Promise.all([
      Activity.find({ actor: { $in: ids }, type: { $ne: 'suggested' } })
        .populate(POPULATE)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Activity.countDocuments({ actor: { $in: ids }, type: { $ne: 'suggested' } })
    ])

    res.json({ activities, hasMore: skip + activities.length < total })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
