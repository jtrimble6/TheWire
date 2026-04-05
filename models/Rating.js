const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ContentItem = require('./ContentItem')

const ratingSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  contentItemId: { type: Schema.Types.ObjectId, ref: 'ContentItem', required: true },
  score: { type: Number, required: true, min: 1, max: 10 },
  createdAt: { type: Date, default: Date.now }
})

ratingSchema.index({ userId: 1, contentItemId: 1 }, { unique: true })

ratingSchema.post('save', async function () {
  const ratings = await this.constructor.find({ contentItemId: this.contentItemId })
  const avg = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
  await ContentItem.findByIdAndUpdate(this.contentItemId, {
    averageRating: Math.round(avg * 10) / 10,
    totalRatings: ratings.length
  })
})

const Rating = mongoose.model('Rating', ratingSchema)

module.exports = Rating
