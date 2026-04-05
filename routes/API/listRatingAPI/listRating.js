const router = require('express').Router()
const listRatingController = require('../../../controllers/listRatingController')
const requireAuth = require('../../../middleware/requireAuth')

// GET /api/list-ratings/:listId/me
router.get('/:listId/me', requireAuth, listRatingController.getMyRating)

// POST /api/list-ratings/:listId
router.post('/:listId', requireAuth, listRatingController.upsertRating)

module.exports = router
