const router = require('express').Router()
const watchlistController = require('../../../controllers/watchlistController')
const requireAuth = require('../../../middleware/requireAuth')

// All watchlist routes require auth
router.use(requireAuth)

// GET /api/watchlist
router.get('/', watchlistController.getWatchlist)

// GET /api/watchlist/history
router.get('/history', watchlistController.getWatchedHistory)

// POST /api/watchlist
router.post('/', watchlistController.addToWatchlist)

// PATCH /api/watchlist/:contentItemId
router.patch('/:contentItemId', watchlistController.updateStatus)

// DELETE /api/watchlist/:contentItemId
router.delete('/:contentItemId', watchlistController.removeFromWatchlist)

// GET /api/watchlist/mutual-followers
router.get('/mutual-followers', watchlistController.getMutualFollowers)

// POST /api/watchlist/suggest
router.post('/suggest', watchlistController.suggestContent)

module.exports = router
