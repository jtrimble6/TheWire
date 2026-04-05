const { Post } = require('../models')
const createNotification = require('../utils/createNotification')

exports.getByReview = async (req, res) => {
  try {
    const comments = await Post.find({ reviewId: req.params.reviewId, parentId: null })
      .sort({ createdAt: 1 })
      .populate('authorId', 'username displayName avatarUrl')
    res.json({ comments })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getByParent = async (req, res) => {
  try {
    const comments = await Post.find({ parentId: req.params.postId })
      .sort({ createdAt: 1 })
      .populate('authorId', 'username displayName avatarUrl')
    res.json({ comments })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getByList = async (req, res) => {
  try {
    const comments = await Post.find({ listId: req.params.listId, parentId: null })
      .sort({ createdAt: 1 })
      .populate('authorId', 'username displayName avatarUrl')
    res.json({ comments })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.create = async (req, res) => {
  const { body, reviewId, parentId, listId } = req.body
  try {
    const post = await Post.create({
      authorId: req.user._id,
      reviewId: reviewId || null,
      parentId: parentId || null,
      listId: listId || null,
      body,
      type: listId ? 'list_comment' : 'review_comment'
    })
    await post.populate('authorId', 'username displayName avatarUrl')
    // Notify the parent post author when someone comments
    if (parentId) {
      const parentPost = await Post.findById(parentId).select('authorId')
      if (parentPost) {
        const io = req.app.get('io')
        createNotification({ io, recipient: parentPost.authorId, actor: req.user._id, type: 'comment', postId: post._id })
      }
    }
    res.status(201).json({ post })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.remove = async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, authorId: req.user._id })
    if (!post) return res.status(404).json({ message: 'Comment not found' })
    await post.deleteOne()
    res.json({ message: 'Comment deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Comment not found' })
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
