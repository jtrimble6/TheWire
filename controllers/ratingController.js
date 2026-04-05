const { Rating, ContentItem } = require('../models')

async function recalcRating(contentItemId) {
  const ratings = await Rating.find({ contentItemId })
  const avg = ratings.length
    ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
    : 0
  await ContentItem.findByIdAndUpdate(contentItemId, {
    averageRating: Math.round(avg * 10) / 10,
    totalRatings: ratings.length
  })
}

exports.upsert = async (req, res) => {
  const { contentItemId, score } = req.body
  if (!score || score < 1 || score > 10) {
    return res.status(400).json({ message: 'Score must be between 1 and 10' })
  }
  try {
    const rating = await Rating.findOneAndUpdate(
      { userId: req.user._id, contentItemId },
      { score },
      { upsert: true, new: true }
    )
    await recalcRating(contentItemId)
    res.json({ rating })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getMyRating = async (req, res) => {
  try {
    const rating = await Rating.findOne({
      userId: req.user._id,
      contentItemId: req.params.contentItemId
    })
    res.json({ rating: rating || null })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.remove = async (req, res) => {
  try {
    await Rating.findOneAndDelete({
      userId: req.user._id,
      contentItemId: req.params.contentItemId
    })
    await recalcRating(req.params.contentItemId)
    res.json({ message: 'Rating removed' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
