const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongoosePaginate = require('mongoose-paginate-v2')

const contentItemSchema = new Schema({
  externalId: { type: String, required: true },
  source: {
    type: String,
    enum: ['tmdb', 'spotify', 'youtube', 'podcastindex', 'musicbrainz'],
    required: true
  },
  type: {
    type: String,
    enum: ['movie', 'tv', 'music', 'album', 'podcast', 'youtube'],
    required: true
  },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  posterUrl: { type: String, default: '' },
  releaseDate: { type: Date },
  genres: [{ type: String }],
  creator: { type: String, default: '' },
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  popularityScore: { type: Number, default: 0 },
  metadata: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
})

contentItemSchema.index({ externalId: 1, source: 1 }, { unique: true })
contentItemSchema.plugin(mongoosePaginate)

const ContentItem = mongoose.model('ContentItem', contentItemSchema)

module.exports = ContentItem
