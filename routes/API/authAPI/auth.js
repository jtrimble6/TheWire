const router = require('express').Router()
const authController = require('../../../controllers/authController')

// POST /api/auth/register
router.post('/register', authController.register)

// POST /api/auth/login
router.post('/login', authController.login)

// POST /api/auth/logout
router.post('/logout', authController.logout)

// GET /api/auth/me
router.get('/me', authController.getSession)

// POST /api/auth/forgot-password
router.post('/forgot-password', authController.forgotPassword)

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', authController.resetPassword)

module.exports = router
