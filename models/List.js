const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const listSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ContentItem' }],
  isPublic: { type: Boolean, default: true },
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 }
}, { timestamps: true })

listSchema.plugin(mongoosePaginate)

module.exports = mongoose.model('List', listSchema)
