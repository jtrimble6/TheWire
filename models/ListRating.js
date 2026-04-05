const mongoose = require('mongoose')
const Schema = mongoose.Schema
const List = require('./List')

const listRatingSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  listId: { type: Schema.Types.ObjectId, ref: 'List', required: true },
  score: { type: Number, required: true, min: 1, max: 10 },
  createdAt: { type: Date, default: Date.now }
})

listRatingSchema.index({ userId: 1, listId: 1 }, { unique: true })

listRatingSchema.post('save', async function () {
  const ratings = await this.constructor.find({ listId: this.listId })
  const avg = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
  await List.findByIdAndUpdate(this.listId, {
    averageRating: Math.round(avg * 10) / 10,
    totalRatings: ratings.length
  })
})

const ListRating = mongoose.model('ListRating', listRatingSchema)

module.exports = ListRating
