const router = require('express').Router()
const activityController = require('../../../controllers/activityController')
const requireAuth = require('../../../middleware/requireAuth')

// GET /api/activity/feed — following feed (auth required)
router.get('/feed', requireAuth, activityController.getFeed)

// GET /api/activity/:username — profile activity (public, filtered by settings)
router.get('/:username', activityController.getUserActivity)

module.exports = router
