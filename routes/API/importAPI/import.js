const router = require('express').Router()
const importController = require('../../../controllers/importController')
const requireAuth = require('../../../middleware/requireAuth')

// POST /api/import — multipart/form-data, field name: "file"
router.post('/', requireAuth, importController.upload, importController.importCSV)

module.exports = router
