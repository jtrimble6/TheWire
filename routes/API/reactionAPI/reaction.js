const router = require('express').Router()
const reactionController = require('../../../controllers/reactionController')
const requireAuth = require('../../../middleware/requireAuth')

// POST /api/reactions/migrate — one-time migration (auth required, restrict to admin in prod)
router.post('/migrate', requireAuth, reactionController.migrateAll)

// GET  /api/reactions/:reviewId — get counts + current user's reaction
router.get('/:reviewId', reactionController.getReactions)

// POST /api/reactions/:reviewId — toggle a reaction
router.post('/:reviewId', requireAuth, reactionController.toggleReaction)

module.exports = router
