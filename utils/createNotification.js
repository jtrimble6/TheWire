const { Notification } = require('../models')

/**
 * Creates a notification and emits it via Socket.io to the recipient's room.
 * Safe to call fire-and-forget (swallows errors so callers don't break).
 */
async function createNotification({ io, recipient, actor, type, reviewId = null, postId = null, watchPartyId = null, communityId = null }) {
  // Don't notify yourself
  if (recipient.toString() === actor.toString()) return

  try {
    const notification = await Notification.create({ recipient, actor, type, reviewId, postId, watchPartyId, communityId })
    await notification.populate('actor', 'username displayName avatarUrl')

    if (io) {
      io.to(`user:${recipient}`).emit('notification:new', notification)
    }
  } catch (err) {
    console.error('createNotification error:', err.message)
  }
}

module.exports = createNotification
