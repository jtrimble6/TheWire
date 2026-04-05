const { ListRating } = require('../models')

exports.upsertRating = async (req, res) => {
  const { score } = req.body
  const { listId } = req.params
  try {
    const existing = await ListRating.findOne({ userId: req.user._id, listId })
    if (existing) {
      existing.score = score
      await existing.save()
      res.json({ rating: existing })
    } else {
      const rating = await ListRating.create({ userId: req.user._id, listId, score })
      res.status(201).json({ rating })
    }
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getMyRating = async (req, res) => {
  try {
    const rating = await ListRating.findOne({ userId: req.user._id, listId: req.params.listId })
    res.json({ rating: rating || null })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
