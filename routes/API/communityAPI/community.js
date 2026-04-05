const router = require('express').Router()
const communityController = require('../../../controllers/communityController')
const requireAuth = require('../../../middleware/requireAuth')

// GET  /api/communities           — browse/search all communities
// POST /api/communities           — create a community
router.get('/', communityController.getAll)
router.post('/', requireAuth, communityController.create)

// GET  /api/communities/mine      — communities the user created or joined
router.get('/mine', requireAuth, communityController.getMyCommunities)

// GET  /api/communities/:slug     — community detail
router.get('/:slug', communityController.getBySlug)

// POST /api/communities/:slug/join
// POST /api/communities/:slug/leave
// POST /api/communities/:slug/invite
router.post('/:slug/join', requireAuth, communityController.join)
router.post('/:slug/leave', requireAuth, communityController.leave)
router.post('/:slug/invite', requireAuth, communityController.invite)

// GET  /api/communities/:slug/posts  — paginated community posts
// POST /api/communities/:slug/posts  — create a post
router.get('/:slug/posts', communityController.getPosts)
router.post('/:slug/posts', requireAuth, communityController.createPost)

// DELETE /api/communities/:slug/posts/:postId
// POST   /api/communities/:slug/posts/:postId/like
router.delete('/:slug/posts/:postId', requireAuth, communityController.deletePost)
router.post('/:slug/posts/:postId/like', requireAuth, communityController.togglePostLike)

module.exports = router
