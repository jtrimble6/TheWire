const router = require('express').Router()
const listController = require('../../../controllers/listController')
const requireAuth = require('../../../middleware/requireAuth')

// GET /api/lists/me
router.get('/me', requireAuth, listController.getMyLists)

// GET /api/lists/user/:userId
router.get('/user/:userId', listController.getUserLists)

// GET /api/lists/:id
router.get('/:id', listController.getById)

// POST /api/lists
router.post('/', requireAuth, listController.create)

// PATCH /api/lists/:id
router.patch('/:id', requireAuth, listController.update)

// DELETE /api/lists/:id
router.delete('/:id', requireAuth, listController.remove)

// POST /api/lists/:id/items
router.post('/:id/items', requireAuth, listController.addItem)

// DELETE /api/lists/:id/items/:itemId
router.delete('/:id/items/:itemId', requireAuth, listController.removeItem)

module.exports = router
