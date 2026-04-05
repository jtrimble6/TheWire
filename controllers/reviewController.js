const { Review, ContentItem } = require('../models')
const createNotification = require('../utils/createNotification')
const createActivity = require('../utils/createActivity')

exports.getByContent = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'newest' } = req.query
    const sortMap = { newest: { createdAt: -1 }, top: { likes: -1 } }
    const result = await Review.paginate(
      { contentItemId: req.params.contentItemId },
      {
        page: Number(page),
        limit: Number(limit),
        sort: sortMap[sort] || sortMap.newest,
        populate: { path: 'userId', select: 'username displayName avatarUrl' }
      }
    )
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.create = async (req, res) => {
  const { contentItemId, title, body, containsSpoilers, rating } = req.body
  try {
    const review = await Review.create({
      userId: req.user._id,
      contentItemId,
      title,
      body,
      containsSpoilers: containsSpoilers || false,
      rating: rating || null
    })
    await ContentItem.findByIdAndUpdate(contentItemId, { $inc: { totalReviews: 1 } })
    await review.populate('userId', 'username displayName avatarUrl')
    await review.populate('contentItemId', 'title type posterUrl')
    const io = req.app.get('io')
    if (io) io.emit('feed:new', review)
    createActivity({ io, actor: req.user._id, type: 'reviewed', contentItem: contentItemId, review: review._id })
    res.status(201).json({ review })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.update = async (req, res) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, userId: req.user._id })
    if (!review) return res.status(404).json({ message: 'Review not found' })
    const { title, body, containsSpoilers } = req.body
    if (title !== undefined) review.title = title
    if (body !== undefined) review.body = body
    if (containsSpoilers !== undefined) review.containsSpoilers = containsSpoilers
    review.updatedAt = new Date()
    await review.save()
    await review.populate('userId', 'username displayName avatarUrl')
    res.json({ review })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.remove = async (req, res) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, userId: req.user._id })
    if (!review) return res.status(404).json({ message: 'Review not found' })
    await review.deleteOne()
    await ContentItem.findByIdAndUpdate(review.contentItemId, { $inc: { totalReviews: -1 } })
    res.json({ message: 'Review deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.toggleLike = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) return res.status(404).json({ message: 'Review not found' })
    const userId = req.user._id.toString()
    const alreadyLiked = review.likedBy.some(id => id.toString() === userId)
    if (alreadyLiked) {
      review.likedBy = review.likedBy.filter(id => id.toString() !== userId)
      review.likes = Math.max(0, review.likes - 1)
    } else {
      review.likedBy.push(req.user._id)
      review.likes += 1
    }
    await review.save()
    if (!alreadyLiked) {
      const io = req.app.get('io')
      createNotification({ io, recipient: review.userId, actor: req.user._id, type: 'like_review', reviewId: review._id })
    }
    res.json({ likes: review.likes, liked: !alreadyLiked })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
