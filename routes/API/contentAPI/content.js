const router = require('express').Router()
const contentController = require('../../../controllers/contentController')

// GET /api/content/search?q=&type=
router.get('/search', contentController.search)

// GET /api/content/browse?provider=8&mediaType=movie&page=1
router.get('/browse', contentController.browseByProvider)

// GET /api/content/trending
router.get('/trending', contentController.getTrending)

// GET /api/content/:id/meta — communities + top reviewers
router.get('/:id/meta', contentController.getContentMeta)

// GET /api/content/:id/watch — streaming/availability providers
router.get('/:id/watch', contentController.getWatchProviders)

// GET /api/content/:id/recommendations
router.get('/:id/recommendations', contentController.getRecommendations)

// GET /api/content/:id
router.get('/:id', contentController.getById)

module.exports = router
