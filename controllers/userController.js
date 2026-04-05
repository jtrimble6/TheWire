const { User, Review, Watchlist } = require('../models')
const createNotification = require('../utils/createNotification')
const createActivity = require('../utils/createActivity')

const REVIEW_POPULATE = [
  { path: 'userId', select: 'username displayName avatarUrl' },
  { path: 'contentItemId', select: 'title type posterUrl' }
]

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findOne(
      { username: req.params.username },
      'username displayName bio avatarUrl followers following joinDate'
    )
    if (!user) return res.status(404).json({ message: 'User not found' })

    const reviewCount = await Review.countDocuments({ userId: user._id })
    const isFollowing = req.user
      ? user.followers.some(id => id.toString() === req.user._id.toString())
      : false
    const isOwnProfile = req.user?._id.toString() === user._id.toString()

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        followerCount: user.followers.length,
        followingCount: user.following.length,
        joinDate: user.joinDate
      },
      reviewCount,
      isFollowing,
      isOwnProfile
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getUserReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const user = await User.findOne({ username: req.params.username })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const result = await Review.paginate(
      { userId: user._id },
      { page: Number(page), limit: Number(limit), sort: { createdAt: -1 }, populate: REVIEW_POPULATE }
    )
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.follow = async (req, res) => {
  try {
    const target = await User.findOne({ username: req.params.username })
    if (!target) return res.status(404).json({ message: 'User not found' })
    if (target._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot follow yourself' })
    }
    await User.updateOne({ _id: target._id }, { $addToSet: { followers: req.user._id } })
    await User.updateOne({ _id: req.user._id }, { $addToSet: { following: target._id } })
    const io = req.app.get('io')
    createNotification({ io, recipient: target._id, actor: req.user._id, type: 'follow' })
    createActivity({ io, actor: req.user._id, type: 'followed', targetUser: target._id })
    res.json({ isFollowing: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.unfollow = async (req, res) => {
  try {
    const target = await User.findOne({ username: req.params.username })
    if (!target) return res.status(404).json({ message: 'User not found' })
    await User.updateOne({ _id: target._id }, { $pull: { followers: req.user._id } })
    await User.updateOne({ _id: req.user._id }, { $pull: { following: target._id } })
    res.json({ isFollowing: false })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query
    if (!q?.trim()) return res.json({ users: [] })
    const regex = new RegExp(q.trim(), 'i')
    const users = await User.find(
      { $or: [{ username: regex }, { displayName: regex }] },
      'username displayName avatarUrl bio followers'
    ).limit(20)
    const results = users.map(u => ({
      _id: u._id,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
      followerCount: u.followers.length
    }))
    res.json({ users: results })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }, 'followers')
      .populate('followers', 'username displayName avatarUrl bio followers')
    if (!user) return res.status(404).json({ message: 'User not found' })
    const followers = user.followers.map(u => ({
      _id: u._id,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
      followerCount: u.followers.length
    }))
    res.json({ followers })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }, 'following')
      .populate('following', 'username displayName avatarUrl bio followers')
    if (!user) return res.status(404).json({ message: 'User not found' })
    const following = user.following.map(u => ({
      _id: u._id,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
      followerCount: u.followers.length
    }))
    res.json({ following })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateProfile = async (req, res) => {
  try {
    const { displayName, bio, avatarUrl } = req.body
    const updates = {}
    if (displayName !== undefined) updates.displayName = displayName.trim()
    if (bio !== undefined) updates.bio = bio.trim()
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl.trim()

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, select: 'username displayName bio avatarUrl' }
    )
    res.json({ user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id, 'displayName bio avatarUrl email settings')
    res.json({ settings: { displayName: user.displayName, bio: user.bio, avatarUrl: user.avatarUrl, email: user.email, ...user.settings?.toObject?.() || user.settings } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateSettings = async (req, res) => {
  try {
    const { displayName, bio, avatarUrl, statsPublic, activityPublic, emailNotifications } = req.body
    const profileUpdates = {}
    const settingsUpdates = {}

    if (displayName !== undefined) profileUpdates.displayName = displayName.trim()
    if (bio !== undefined) profileUpdates.bio = bio.trim()
    if (avatarUrl !== undefined) profileUpdates.avatarUrl = avatarUrl.trim()
    if (statsPublic !== undefined) settingsUpdates['settings.statsPublic'] = Boolean(statsPublic)
    if (activityPublic !== undefined) settingsUpdates['settings.activityPublic'] = Boolean(activityPublic)
    if (emailNotifications !== undefined) settingsUpdates['settings.emailNotifications'] = Boolean(emailNotifications)

    const updates = { ...profileUpdates, ...settingsUpdates }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, select: 'username displayName bio avatarUrl settings' }
    )
    res.json({ user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getStats = async (req, res) => {
  try {
    const { username } = req.params
    const user = await User.findOne({ username }, '_id settings')
    if (!user) return res.status(404).json({ message: 'User not found' })

    const isOwn = req.user?._id.toString() === user._id.toString()
    if (!isOwn && user.settings?.statsPublic === false) {
      return res.json({ hidden: true })
    }

    const { Rating, Review, ContentItem } = require('../models')

    const [watchedItems, reviews, ratings] = await Promise.all([
      Watchlist.find({ userId: user._id, status: 'watched' }).populate('contentItemId', 'type genres'),
      Review.countDocuments({ userId: user._id }),
      Rating.find({ userId: user._id }, 'score')
    ])

    // Genre breakdown
    const genreMap = {}
    watchedItems.forEach(w => {
      (w.contentItemId?.genres || []).forEach(g => { genreMap[g] = (genreMap[g] || 0) + 1 })
    })
    const genres = Object.entries(genreMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))

    // Content type breakdown
    const typeMap = {}
    watchedItems.forEach(w => {
      const t = w.contentItemId?.type || 'unknown'
      typeMap[t] = (typeMap[t] || 0) + 1
    })

    // Rating distribution
    const ratingDist = Array.from({ length: 10 }, (_, i) => ({
      score: i + 1,
      count: ratings.filter(r => r.score === i + 1).length
    }))

    res.json({
      watchedCount: watchedItems.length,
      reviewCount: reviews,
      ratingCount: ratings.length,
      genres,
      typeBreakdown: typeMap,
      ratingDistribution: ratingDist
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
