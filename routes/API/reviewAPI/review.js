const router = require('express').Router()
const reviewController = require('../../../controllers/reviewController')
const requireAuth = require('../../../middleware/requireAuth')

// GET /api/reviews/content/:contentItemId
router.get('/content/:contentItemId', reviewController.getByContent)

// POST /api/reviews
router.post('/', requireAuth, reviewController.create)

// PUT /api/reviews/:id
router.put('/:id', requireAuth, reviewController.update)

// DELETE /api/reviews/:id
router.delete('/:id', requireAuth, reviewController.remove)

// POST /api/reviews/:id/like
router.post('/:id/like', requireAuth, reviewController.toggleLike)

module.exports = router
