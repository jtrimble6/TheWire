const mongoose = require('mongoose')
const Schema = mongoose.Schema

const reactionSchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reviewId: { type: Schema.Types.ObjectId, ref: 'Review', required: true },
  type: {
    type: String,
    enum: ['agree', 'disagree', 'insightful', 'funny'],
    required: true
  },
  createdAt: { type: Date, default: Date.now }
})

// One reaction per user per review (toggle replaces previous type)
reactionSchema.index({ userId: 1, reviewId: 1 }, { unique: true })
reactionSchema.index({ reviewId: 1 })

module.exports = mongoose.model('Reaction', reactionSchema)
