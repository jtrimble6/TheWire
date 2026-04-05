const { Community, Post, User } = require('../models')
const createNotification = require('../utils/createNotification')

exports.getAll = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query
    const filter = { isPublic: { $ne: false } }
    if (q) filter.name = { $regex: q, $options: 'i' }
    const result = await Community.paginate(filter, {
      page: Number(page),
      limit: Number(limit),
      sort: { memberCount: -1 },
      populate: { path: 'createdBy', select: 'username displayName' }
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getBySlug = async (req, res) => {
  try {
    const community = await Community.findOne({ slug: req.params.slug })
      .populate('createdBy', 'username displayName')
    if (!community) return res.status(404).json({ message: 'Community not found' })
    const uid = req.user?._id?.toString()
    const isMember = uid ? community.members.some(id => id.toString() === uid) : false
    const isInvited = uid ? community.invites.some(id => id.toString() === uid) : false
    res.json({ community, isMember, isInvited })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getMyCommunities = async (req, res) => {
  try {
    const communities = await Community.find({
      $or: [{ createdBy: req.user._id }, { members: req.user._id }]
    })
      .populate('createdBy', 'username displayName')
      .sort({ createdAt: -1 })
    res.json({ communities })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.create = async (req, res) => {
  const { name, description, type, isPublic } = req.body
  if (!name?.trim()) return res.status(400).json({ message: 'Name is required' })
  try {
    const community = await Community.create({
      name: name.trim(),
      description: description?.trim() || '',
      type: type || 'custom',
      isPublic: isPublic !== false,
      createdBy: req.user._id,
      members: [req.user._id],
      memberCount: 1
    })
    await community.populate('createdBy', 'username displayName')
    res.status(201).json({ community })
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'A community with that name already exists' })
    res.status(500).json({ message: err.message })
  }
}

exports.join = async (req, res) => {
  try {
    const community = await Community.findOne({ slug: req.params.slug })
    if (!community) return res.status(404).json({ message: 'Community not found' })
    const uid = req.user._id.toString()
    const alreadyMember = community.members.some(id => id.toString() === uid)
    // Private communities require an invite (or already being a member)
    const isInvited = community.invites.some(id => id.toString() === uid)
    if (!community.isPublic && !isInvited && !alreadyMember) {
      return res.status(403).json({ message: 'This is a private community. You need an invite to join.' })
    }
    if (!alreadyMember) {
      community.members.push(req.user._id)
      community.memberCount += 1
    }
    // Remove from invites regardless
    community.invites = community.invites.filter(id => id.toString() !== uid)
    await community.save()
    res.json({ memberCount: community.memberCount, isMember: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.invite = async (req, res) => {
  const { usernames } = req.body // array of usernames to invite
  if (!Array.isArray(usernames) || usernames.length === 0) {
    return res.status(400).json({ message: 'usernames array is required' })
  }
  try {
    const community = await Community.findOne({ slug: req.params.slug })
    if (!community) return res.status(404).json({ message: 'Community not found' })
    if (community.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the creator can invite members' })
    }

    const users = await User.find({ username: { $in: usernames } }, '_id username')
    const io = req.app.get('io')

    for (const user of users) {
      const uid = user._id.toString()
      const alreadyMember = community.members.some(id => id.toString() === uid)
      const alreadyInvited = community.invites.some(id => id.toString() === uid)
      if (!alreadyMember && !alreadyInvited) {
        community.invites.push(user._id)
        createNotification({ io, recipient: user._id, actor: req.user._id, type: 'community_invite', communityId: community._id })
      }
    }

    await community.save()
    res.json({ invited: users.map(u => u.username) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.leave = async (req, res) => {
  try {
    const community = await Community.findOne({ slug: req.params.slug })
    if (!community) return res.status(404).json({ message: 'Community not found' })
    community.members = community.members.filter(id => id.toString() !== req.user._id.toString())
    community.memberCount = Math.max(0, community.memberCount - 1)
    await community.save()
    res.json({ memberCount: community.memberCount, isMember: false })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const community = await Community.findOne({ slug: req.params.slug })
    if (!community) return res.status(404).json({ message: 'Community not found' })
    const result = await Post.paginate(
      { communityId: community._id, type: 'community_post', parentId: null },
      {
        page: Number(page),
        limit: Number(limit),
        sort: { createdAt: -1 },
        populate: { path: 'authorId', select: 'username displayName avatarUrl' }
      }
    )
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.createPost = async (req, res) => {
  const { body } = req.body
  if (!body?.trim()) return res.status(400).json({ message: 'Post body is required' })
  try {
    const community = await Community.findOne({ slug: req.params.slug })
    if (!community) return res.status(404).json({ message: 'Community not found' })
    const post = await Post.create({
      authorId: req.user._id,
      communityId: community._id,
      body: body.trim(),
      type: 'community_post'
    })
    await post.populate('authorId', 'username displayName avatarUrl')
    await Community.findByIdAndUpdate(community._id, { $inc: { postCount: 1 } })
    const io = req.app.get('io')
    if (io) io.to(`community:${community.slug}`).emit('community:new_post', post)
    res.status(201).json({ post })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.postId, authorId: req.user._id })
    if (!post) return res.status(404).json({ message: 'Post not found' })
    const communityId = post.communityId
    await post.deleteOne()
    if (communityId) {
      await Community.findByIdAndUpdate(communityId, { $inc: { postCount: -1 } })
    }
    res.json({ message: 'Post deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.togglePostLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
    if (!post) return res.status(404).json({ message: 'Post not found' })
    const userId = req.user._id.toString()
    const alreadyLiked = post.likedBy.some(id => id.toString() === userId)
    if (alreadyLiked) {
      post.likedBy = post.likedBy.filter(id => id.toString() !== userId)
      post.likes = Math.max(0, post.likes - 1)
    } else {
      post.likedBy.push(req.user._id)
      post.likes += 1
    }
    await post.save()
    res.json({ likes: post.likes, liked: !alreadyLiked })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
