const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongoosePaginate = require('mongoose-paginate-v2')

const postSchema = new Schema({
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  communityId: { type: Schema.Types.ObjectId, ref: 'Community', default: null },
  reviewId: { type: Schema.Types.ObjectId, ref: 'Review', default: null },
  parentId: { type: Schema.Types.ObjectId, ref: 'Post', default: null },
  listId: { type: Schema.Types.ObjectId, ref: 'List', default: null },
  body: { type: String, required: true },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  type: {
    type: String,
    enum: ['community_post', 'review_comment', 'feed_post', 'list_comment'],
    required: true
  },
  createdAt: { type: Date, default: Date.now }
})

postSchema.plugin(mongoosePaginate)

const Post = mongoose.model('Post', postSchema)

module.exports = Post
