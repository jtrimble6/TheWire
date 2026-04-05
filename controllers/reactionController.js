const { Reaction, Review } = require('../models')
const createNotification = require('../utils/createNotification')

/**
 * GET /api/reactions/:reviewId
 * Returns reaction counts + the current user's reaction (if any).
 */
exports.getReactions = async (req, res) => {
  try {
    const { reviewId } = req.params
    const reactions = await Reaction.find({ reviewId })

    const counts = { agree: 0, disagree: 0, insightful: 0, funny: 0 }
    reactions.forEach(r => { counts[r.type] = (counts[r.type] || 0) + 1 })

    const myReaction = req.user
      ? (reactions.find(r => r.userId.toString() === req.user._id.toString())?.type || null)
      : null

    res.json({ counts, myReaction })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/**
 * POST /api/reactions/:reviewId
 * Toggle a reaction. If same type exists → remove. If different → replace.
 */
exports.toggleReaction = async (req, res) => {
  try {
    const { reviewId } = req.params
    const { type } = req.body
    const validTypes = ['agree', 'disagree', 'insightful', 'funny']
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid reaction type' })
    }

    const existing = await Reaction.findOne({ userId: req.user._id, reviewId })

    if (existing) {
      if (existing.type === type) {
        // Same type — remove (toggle off)
        await existing.deleteOne()
        await syncLegacyLikes(reviewId)
        return res.json({ myReaction: null, delta: { [type]: -1 } })
      }
      // Different type — replace
      const oldType = existing.type
      existing.type = type
      await existing.save()
      await syncLegacyLikes(reviewId)
      return res.json({ myReaction: type, delta: { [oldType]: -1, [type]: 1 } })
    }

    // New reaction
    await Reaction.create({ userId: req.user._id, reviewId, type })
    await syncLegacyLikes(reviewId)

    // Notify review author on 'agree' (equivalent to old like notification)
    if (type === 'agree') {
      const review = await Review.findById(reviewId, 'userId')
      if (review) {
        const io = req.app.get('io')
        createNotification({ io, recipient: review.userId, actor: req.user._id, type: 'reaction', reviewId })
      }
    }

    res.json({ myReaction: type, delta: { [type]: 1 } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/**
 * POST /api/reactions/migrate
 * One-time migration: converts all existing Review.likedBy entries into Reaction documents.
 * Safe to call multiple times — skips duplicates.
 */
exports.migrateAll = async (req, res) => {
  try {
    const reviews = await Review.find({ 'likedBy.0': { $exists: true } }, 'likedBy')
    let created = 0
    for (const review of reviews) {
      for (const userId of review.likedBy) {
        try {
          await Reaction.updateOne(
            { userId, reviewId: review._id },
            { $setOnInsert: { userId, reviewId: review._id, type: 'agree' } },
            { upsert: true }
          )
          created++
        } catch { /* duplicate — skip */ }
      }
    }
    res.json({ message: `Migration complete. ${created} reactions created.` })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Keep Review.likes in sync with agree-reaction count for backward compat
async function syncLegacyLikes(reviewId) {
  const agreeCount = await Reaction.countDocuments({ reviewId, type: 'agree' })
  await Review.findByIdAndUpdate(reviewId, { $set: { likes: agreeCount } })
}
