const router = require('express').Router()
const notificationController = require('../../../controllers/notificationController')
const requireAuth = require('../../../middleware/requireAuth')

// GET /api/notifications
router.get('/', requireAuth, notificationController.getNotifications)

// GET /api/notifications/unread-count
router.get('/unread-count', requireAuth, notificationController.getUnreadCount)

// PATCH /api/notifications/read
router.patch('/read', requireAuth, notificationController.markRead)

module.exports = router
