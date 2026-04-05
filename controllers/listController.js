const { List } = require('../models')

exports.getMyLists = async (req, res) => {
  try {
    const lists = await List.find({ owner: req.user._id })
      .sort({ updatedAt: -1 })
      .populate('items', 'title type posterUrl')
    res.json({ lists })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getUserLists = async (req, res) => {
  try {
    const { userId } = req.params
    const isOwner = req.user?._id.toString() === userId
    const query = isOwner ? { owner: userId } : { owner: userId, isPublic: true }
    const lists = await List.find(query)
      .sort({ updatedAt: -1 })
      .populate('items', 'title type posterUrl')
    res.json({ lists })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getById = async (req, res) => {
  try {
    const list = await List.findById(req.params.id)
      .populate('owner', 'username displayName avatarUrl')
      .populate('items', 'title type posterUrl creator releaseDate averageRating')
    if (!list) return res.status(404).json({ message: 'List not found' })
    if (!list.isPublic && list.owner._id.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: 'This list is private' })
    }
    res.json({ list })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.create = async (req, res) => {
  const { title, description, isPublic } = req.body
  try {
    const list = await List.create({
      owner: req.user._id,
      title: title?.trim(),
      description: description?.trim() || '',
      isPublic: isPublic !== false
    })
    res.status(201).json({ list })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.update = async (req, res) => {
  try {
    const list = await List.findOne({ _id: req.params.id, owner: req.user._id })
    if (!list) return res.status(404).json({ message: 'List not found' })
    const { title, description, isPublic } = req.body
    if (title !== undefined) list.title = title.trim()
    if (description !== undefined) list.description = description.trim()
    if (isPublic !== undefined) list.isPublic = isPublic
    await list.save()
    res.json({ list })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.remove = async (req, res) => {
  try {
    const list = await List.findOneAndDelete({ _id: req.params.id, owner: req.user._id })
    if (!list) return res.status(404).json({ message: 'List not found' })
    res.json({ message: 'List deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.addItem = async (req, res) => {
  try {
    const list = await List.findOne({ _id: req.params.id, owner: req.user._id })
    if (!list) return res.status(404).json({ message: 'List not found' })
    const { contentItemId } = req.body
    if (!list.items.some(id => id.toString() === contentItemId)) {
      list.items.push(contentItemId)
      await list.save()
    }
    res.json({ list })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.removeItem = async (req, res) => {
  try {
    const list = await List.findOne({ _id: req.params.id, owner: req.user._id })
    if (!list) return res.status(404).json({ message: 'List not found' })
    list.items = list.items.filter(id => id.toString() !== req.params.itemId)
    await list.save()
    res.json({ list })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
