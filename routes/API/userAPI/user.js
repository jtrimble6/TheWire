const router = require('express').Router()
const userController = require('../../../controllers/userController')
const requireAuth = require('../../../middleware/requireAuth')

// GET /api/users?q=search — must be before /:username
router.get('/', userController.searchUsers)

// PATCH /api/users/me — must be before /:username to avoid conflict
router.patch('/me', requireAuth, userController.updateProfile)

// GET/PATCH /api/users/settings
router.get('/settings', requireAuth, userController.getSettings)
router.patch('/settings', requireAuth, userController.updateSettings)

// GET  /api/users/:username
// GET  /api/users/:username/reviews
// GET  /api/users/:username/followers
// GET  /api/users/:username/following
// GET /api/users/:username/stats
router.get('/:username/stats', userController.getStats)

router.get('/:username', userController.getProfile)
router.get('/:username/reviews', userController.getUserReviews)
router.get('/:username/followers', userController.getFollowers)
router.get('/:username/following', userController.getFollowing)

// POST /api/users/:username/follow
// POST /api/users/:username/unfollow
router.post('/:username/follow', requireAuth, userController.follow)
router.post('/:username/unfollow', requireAuth, userController.unfollow)

module.exports = router
