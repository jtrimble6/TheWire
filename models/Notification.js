const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['like_review', 'follow', 'comment', 'like_post', 'reaction', 'watchparty_invite', 'watchparty_start', 'community_invite'],
    required: true
  },
  reviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', default: null },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
  watchPartyId: { type: mongoose.Schema.Types.ObjectId, ref: 'WatchParty', default: null },
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', default: null },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Notification', notificationSchema)
