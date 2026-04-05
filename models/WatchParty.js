const mongoose = require('mongoose')
const Schema = mongoose.Schema

const messageSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text:      { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now }
})

const watchPartySchema = new Schema({
  title:         { type: String, required: true, trim: true, maxlength: 100 },
  hostId:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
  contentItemId: { type: Schema.Types.ObjectId, ref: 'ContentItem', required: true },
  scheduledAt:   { type: Date, required: true },
  startedAt:     { type: Date },
  expiresAt:     { type: Date }, // set when party starts: startedAt + 24h
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended'],
    default: 'scheduled'
  },
  isPublic:     { type: Boolean, default: false },
  recurrence:   { type: String, enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'], default: 'none' },
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  invites:      [{ type: Schema.Types.ObjectId, ref: 'User' }],
  messages:     [messageSchema],
  createdAt:    { type: Date, default: Date.now }
})

watchPartySchema.index({ hostId: 1, createdAt: -1 })
watchPartySchema.index({ scheduledAt: 1 })
watchPartySchema.index({ invites: 1 })
watchPartySchema.index({ isPublic: 1, status: 1, scheduledAt: 1 })
watchPartySchema.index({ expiresAt: 1 })

module.exports = mongoose.model('WatchParty', watchPartySchema)
