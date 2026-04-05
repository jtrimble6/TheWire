const { Review, User, Community } = require('../models')

const POPULATE = [
  { path: 'userId', select: 'username displayName avatarUrl' },
  { path: 'contentItemId', select: 'title type posterUrl' }
]

exports.getGlobalFeed = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 20
    const query = req.user ? { userId: { $ne: req.user._id } } : {}
    const result = await Review.paginate(query, {
      page, limit,
      sort: { rating: -1, likes: -1 },
      populate: POPULATE
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getMyFeed = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 20
    const result = await Review.paginate(
      { userId: req.user._id },
      { page, limit, sort: { createdAt: -1 }, populate: POPULATE }
    )
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getFollowingFeed = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 20
    const currentUser = await User.findById(req.user._id, 'following')
    const authorIds = currentUser.following
    const result = await Review.paginate(
      { userId: { $in: authorIds } },
      { page, limit, sort: { rating: -1, likes: -1 }, populate: POPULATE }
    )
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getCommunitiesFeed = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 20
    const result = await Community.paginate(
      { members: req.user._id },
      {
        page, limit,
        sort: { memberCount: -1, postCount: -1 },
        populate: { path: 'createdBy', select: 'username displayName' }
      }
    )
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
