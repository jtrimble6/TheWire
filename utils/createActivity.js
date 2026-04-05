const { Activity } = require('../models')

/**
 * Creates an activity record and broadcasts it via Socket.io.
 * Safe to call fire-and-forget — swallows errors so callers don't break.
 *
 * @param {object} opts
 * @param {object} opts.io         - Socket.io server instance
 * @param {ObjectId} opts.actor    - User who performed the action
 * @param {string}   opts.type     - Activity type
 * @param {ObjectId} [opts.contentItem]
 * @param {ObjectId} [opts.targetUser]
 * @param {ObjectId} [opts.review]
 * @param {ObjectId} [opts.list]
 * @param {number}   [opts.score]
 */
async function createActivity({ io, actor, type, contentItem, targetUser, review, list, score }) {
  try {
    const activity = await Activity.create({ actor, type, contentItem, targetUser, review, list, score })
    await activity.populate('actor', 'username displayName avatarUrl')
    if (contentItem) await activity.populate('contentItem', 'title type posterUrl')
    if (targetUser)  await activity.populate('targetUser', 'username displayName')

    if (io) {
      // Emit to the actor's own room so their profile feed updates in real-time
      io.to(`user:${actor}`).emit('activity:new', activity)
    }
  } catch (err) {
    console.error('createActivity error:', err.message)
  }
}

module.exports = createActivity
