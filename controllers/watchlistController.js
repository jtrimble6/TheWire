const { Watchlist, User } = require('../models')
const createActivity = require('../utils/createActivity')

exports.getWatchlist = async (req, res) => {
  try {
    // Exclude 'watched' items — they live in watch history
    const items = await Watchlist.find({ userId: req.user._id, status: { $ne: 'watched' } })
      .populate('contentItemId')
      .populate('suggestedBy', 'username displayName')
      .sort({ addedAt: -1 })
    res.json({ items })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getWatchedHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const skip = (Number(page) - 1) * Number(limit)
    const [items, total] = await Promise.all([
      Watchlist.find({ userId: req.user._id, status: 'watched' })
        .populate('contentItemId', 'title type posterUrl averageRating')
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Watchlist.countDocuments({ userId: req.user._id, status: 'watched' })
    ])
    res.json({ items, total, hasMore: skip + items.length < total })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.addToWatchlist = async (req, res) => {
  const { contentItemId, status } = req.body
  try {
    const entry = await Watchlist.findOneAndUpdate(
      { userId: req.user._id, contentItemId },
      { $set: { status: status || 'waiting', addedAt: new Date() } },
      { upsert: true, new: true }
    ).populate('contentItemId', 'title type posterUrl')

    const io = req.app.get('io')
    createActivity({ io, actor: req.user._id, type: 'watchlisted', contentItem: contentItemId })

    res.json({ entry })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateStatus = async (req, res) => {
  const { status, userNote } = req.body
  try {
    const update = { status }
    if (userNote !== undefined) update.userNote = userNote
    if (status === 'watched') update.completedAt = new Date()

    const entry = await Watchlist.findOneAndUpdate(
      { userId: req.user._id, contentItemId: req.params.contentItemId },
      { $set: update },
      { new: true }
    ).populate('contentItemId', 'title type posterUrl')

    if (!entry) return res.status(404).json({ message: 'Watchlist entry not found' })

    if (status === 'watched') {
      const io = req.app.get('io')
      createActivity({ io, actor: req.user._id, type: 'watched', contentItem: entry.contentItemId._id })
    }

    res.json({ entry })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.removeFromWatchlist = async (req, res) => {
  try {
    await Watchlist.findOneAndDelete({
      userId: req.user._id,
      contentItemId: req.params.contentItemId
    })
    res.json({ message: 'Removed from watchlist' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getMutualFollowers = async (req, res) => {
  try {
    const me = await User.findById(req.user._id).select('followers following')
    const followingSet = new Set(me.following.map(id => id.toString()))
    const mutualIds = me.followers.filter(id => followingSet.has(id.toString()))
    const users = await User.find(
      { _id: { $in: mutualIds } },
      'username displayName avatarUrl'
    )
    res.json({ users })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.suggestContent = async (req, res) => {
  const { contentItemId, targetUserId } = req.body
  try {
    // Validate mutual following
    const me = await User.findById(req.user._id).select('followers following')
    const isFollowing = me.following.some(id => id.toString() === targetUserId)
    const isFollowedBy = me.followers.some(id => id.toString() === targetUserId)
    if (!isFollowing || !isFollowedBy) {
      return res.status(403).json({ message: 'Can only suggest to mutual followers' })
    }
    const entry = await Watchlist.findOneAndUpdate(
      { userId: targetUserId, contentItemId },
      { $set: { status: 'suggested', suggestedBy: req.user._id, addedAt: new Date() } },
      { upsert: true, new: true }
    ).populate('contentItemId').populate('suggestedBy', 'username displayName')
    res.json({ entry })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
