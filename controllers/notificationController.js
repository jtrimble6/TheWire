const { Notification } = require('../models')

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('actor', 'username displayName avatarUrl')
      .populate('reviewId', 'title contentItemId')
      .populate('postId', 'body')
      .populate('communityId', 'slug name')
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, read: false })
    res.json({ notifications, unreadCount })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.markRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { $set: { read: true } }
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, read: false })
    res.json({ count })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
