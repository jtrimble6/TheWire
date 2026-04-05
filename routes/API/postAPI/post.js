const router = require('express').Router()
const postController = require('../../../controllers/postController')
const requireAuth = require('../../../middleware/requireAuth')

// GET /api/posts/list/:listId
router.get('/list/:listId', postController.getByList)

// GET /api/posts/review/:reviewId
router.get('/review/:reviewId', postController.getByReview)

// GET /api/posts/parent/:postId
router.get('/parent/:postId', postController.getByParent)

// POST /api/posts
router.post('/', requireAuth, postController.create)

// DELETE /api/posts/:id
router.delete('/:id', requireAuth, postController.remove)

// POST /api/posts/:id/like
router.post('/:id/like', requireAuth, postController.toggleLike)

module.exports = router
