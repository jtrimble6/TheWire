const router = require('express').Router()
const wpc = require('../../../controllers/watchPartyController')
const requireAuth = require('../../../middleware/requireAuth')

router.post('/',              requireAuth, wpc.create)
router.get('/mine',           requireAuth, wpc.getMyParties)
router.get('/public',         wpc.getPublicParties)
router.get('/:id',            wpc.getById)
router.patch('/:id',          requireAuth, wpc.update)
router.post('/:id/invite',    requireAuth, wpc.invite)
router.post('/:id/join',      requireAuth, wpc.join)
router.patch('/:id/start',    requireAuth, wpc.start)
router.patch('/:id/end',      requireAuth, wpc.end)
router.patch('/:id/rsvp',     requireAuth, wpc.rsvp)

module.exports = router
