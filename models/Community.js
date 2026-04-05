const mongoose = require('mongoose')
const Schema = mongoose.Schema
const slugify = require('slugify')
const mongoosePaginate = require('mongoose-paginate-v2')

const communitySchema = new Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, unique: true },
  description: { type: String, default: '' },
  type: {
    type: String,
    enum: ['show', 'artist', 'genre', 'custom'],
    default: 'custom'
  },
  contentItemId: { type: Schema.Types.ObjectId, ref: 'ContentItem', default: null },
  bannerUrl: { type: String, default: '' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  invites: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isPublic: { type: Boolean, default: true },
  memberCount: { type: Number, default: 0 },
  postCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
})

communitySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true })
  }
  next()
})

communitySchema.plugin(mongoosePaginate)

const Community = mongoose.model('Community', communitySchema)

module.exports = Community
