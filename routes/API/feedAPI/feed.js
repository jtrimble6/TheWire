const router = require('express').Router()
const feedController = require('../../../controllers/feedController')
const requireAuth = require('../../../middleware/requireAuth')

router.get('/', feedController.getGlobalFeed)
router.get('/me', requireAuth, feedController.getMyFeed)
router.get('/following', requireAuth, feedController.getFollowingFeed)
router.get('/communities', requireAuth, feedController.getCommunitiesFeed)

module.exports = router
