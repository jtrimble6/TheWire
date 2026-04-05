const crypto = require('crypto')
const passport = require('passport')
const { User } = require('../models')
const emailService = require('../services/emailService')

exports.register = async (req, res) => {
  const { username, email, password, displayName } = req.body
  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] })
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already taken' })
    }
    const user = await User.create({ username, email, password, displayName: displayName || username })
    req.login(user, (err) => {
      if (err) return res.status(500).json({ message: 'Login after register failed' })
      // Fire-and-forget welcome email
      emailService.sendWelcomeEmail({ email: user.email, displayName: user.displayName })
        .catch(e => console.error('Welcome email failed:', e.message))
      res.json({ user: { _id: user._id, username: user.username, email: user.email, displayName: user.displayName } })
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err)
    if (!user) return res.status(401).json({ message: info.message || 'Login failed' })
    req.login(user, (err) => {
      if (err) return next(err)
      res.json({ user: { _id: user._id, username: user.username, email: user.email, displayName: user.displayName, avatarUrl: user.avatarUrl } })
    })
  })(req, res, next)
}

exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: 'Logout failed' })
    res.json({ message: 'Logged out successfully' })
  })
}

exports.getSession = (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({ user: req.user })
  }
  res.status(401).json({ message: 'Not authenticated' })
}

exports.forgotPassword = async (req, res) => {
  const { email } = req.body
  // Always respond the same way to prevent email enumeration
  const genericMessage = 'If an account with that email exists, a reset link has been sent.'
  try {
    const user = await User.findOne({ email })
    if (!user) return res.json({ message: genericMessage })

    const rawToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')

    await User.updateOne(
      { _id: user._id },
      { $set: { resetPasswordToken: hashedToken, resetPasswordExpires: Date.now() + 3600000 } }
    )

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${rawToken}`
    await emailService.sendPasswordResetEmail({ email: user.email, displayName: user.displayName, resetUrl })

    res.json({ message: genericMessage })
  } catch (err) {
    console.error('Forgot password error:', err.message)
    res.status(500).json({ message: 'Could not send reset email. Please try again.' })
  }
}

exports.resetPassword = async (req, res) => {
  const { token } = req.params
  const { password } = req.body
  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    })
    if (!user) return res.status(400).json({ message: 'Reset link is invalid or has expired.' })

    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    res.json({ message: 'Password reset successful.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
