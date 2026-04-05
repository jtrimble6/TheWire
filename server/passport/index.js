const passport = require('passport')
const LocalStrategy = require('./localStrategy')
const { User } = require('../../models')

passport.serializeUser((user, done) => {
  done(null, { _id: user._id })
})

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findOne({ _id: id }, 'username email displayName avatarUrl')
    done(null, user)
  } catch (err) {
    done(err)
  }
})

passport.use(LocalStrategy)

module.exports = passport
