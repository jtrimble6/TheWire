const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongoosePaginate = require('mongoose-paginate-v2')

const reviewSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  contentItemId: { type: Schema.Types.ObjectId, ref: 'ContentItem', required: true },
  title: { type: String, default: '' },
  body: { type: String, required: true },
  containsSpoilers: { type: Boolean, default: false },
  rating: { type: Number, min: 1, max: 10, default: null },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

reviewSchema.plugin(mongoosePaginate)

const Review = mongoose.model('Review', reviewSchema)

module.exports = Review
