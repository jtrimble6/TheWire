const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require('bcryptjs')

const userSchema = new Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  displayName: { type: String, trim: true },
  bio: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  joinDate: { type: Date, default: Date.now },
  settings: {
    statsPublic:          { type: Boolean, default: true },
    activityPublic:       { type: Boolean, default: true },
    emailNotifications:   { type: Boolean, default: true }
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
})

userSchema.methods = {
  checkPassword: function (inputPassword) {
    return bcrypt.compareSync(inputPassword, this.password)
  },
  hashPassword: function (plainTextPassword) {
    return bcrypt.hashSync(plainTextPassword, 10)
  }
}

userSchema.pre('save', function (next) {
  if (!this.isModified('password')) return next()
  this.password = this.hashPassword(this.password)
  next()
})

userSchema.pre('updateOne', function (next) {
  const password = this.getUpdate().$set && this.getUpdate().$set.password
  if (!password) return next()
  try {
    const salt = bcrypt.genSaltSync()
    this.getUpdate().$set.password = bcrypt.hashSync(password, salt)
    next()
  } catch (error) {
    return next(error)
  }
})

const User = mongoose.model('User', userSchema)

module.exports = User
