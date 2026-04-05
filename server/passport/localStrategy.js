const { User } = require('../../models')
const LocalStrategy = require('passport-local').Strategy

const strategy = new LocalStrategy(
  { usernameField: 'username' },
  async function (username, password, done) {
    try {
      const user = await User.findOne({ username })
      if (!user) return done(null, false, { message: 'Incorrect username' })
      if (!user.checkPassword(password)) return done(null, false, { message: 'Incorrect password' })
      return done(null, user)
    } catch (err) {
      return done(err)
    }
  }
)

module.exports = strategy
