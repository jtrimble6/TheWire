const router = require('express').Router()
const ratingController = require('../../../controllers/ratingController')
const requireAuth = require('../../../middleware/requireAuth')

// All rating routes require auth
router.use(requireAuth)

// POST /api/ratings (upsert)
router.post('/', ratingController.upsert)

// GET /api/ratings/:contentItemId/me
router.get('/:contentItemId/me', ratingController.getMyRating)

// DELETE /api/ratings/:contentItemId
router.delete('/:contentItemId', ratingController.remove)

module.exports = router
