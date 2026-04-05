const mongoose = require('mongoose')
const Schema = mongoose.Schema

const watchlistSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  contentItemId: { type: Schema.Types.ObjectId, ref: 'ContentItem', required: true },
  status: {
    type: String,
    enum: ['playing', 'waiting', 'suggested', 'watched'],
    default: 'waiting'
  },
  addedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  userNote: { type: String, default: '' },
  suggestedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
})

watchlistSchema.index({ userId: 1, contentItemId: 1 }, { unique: true })

const Watchlist = mongoose.model('Watchlist', watchlistSchema)

module.exports = Watchlist
