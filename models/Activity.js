const mongoose = require('mongoose')
const Schema = mongoose.Schema

const activitySchema = new Schema({
  actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['rated', 'reviewed', 'watchlisted', 'watched', 'created_list', 'followed', 'suggested'],
    required: true
  },
  contentItem: { type: Schema.Types.ObjectId, ref: 'ContentItem', default: null },
  targetUser:  { type: Schema.Types.ObjectId, ref: 'User', default: null },
  review:      { type: Schema.Types.ObjectId, ref: 'Review', default: null },
  list:        { type: Schema.Types.ObjectId, ref: 'List', default: null },
  score:       { type: Number, default: null },
  createdAt:   { type: Date, default: Date.now }
})

activitySchema.index({ actor: 1, createdAt: -1 })
activitySchema.index({ createdAt: -1 })

module.exports = mongoose.model('Activity', activitySchema)
