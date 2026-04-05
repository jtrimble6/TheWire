const { WatchParty, User } = require('../models')
const createNotification = require('../utils/createNotification')
const { sendWatchPartyConfirmation, sendWatchPartyInvite } = require('../services/emailService')

const BASE_URL = process.env.CLIENT_URL || 'http://localhost:3000'

// Parties expired > 24h after start are hidden from lists
const notExpiredFilter = { $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }] }

function calculateNextOccurrence(date, recurrence) {
  const d = new Date(date)
  switch (recurrence) {
    case 'daily':   d.setDate(d.getDate() + 1); break
    case 'weekly':  d.setDate(d.getDate() + 7); break
    case 'monthly': d.setMonth(d.getMonth() + 1); break
    case 'yearly':  d.setFullYear(d.getFullYear() + 1); break
  }
  return d
}

exports.create = async (req, res) => {
  const { title, contentItemId, scheduledAt, isPublic, recurrence } = req.body
  if (!title || !contentItemId || !scheduledAt) {
    return res.status(400).json({ message: 'title, contentItemId, and scheduledAt are required' })
  }
  try {
    const party = await WatchParty.create({
      title,
      hostId: req.user._id,
      contentItemId,
      scheduledAt: new Date(scheduledAt),
      isPublic: !!isPublic,
      recurrence: recurrence || 'none',
      participants: [req.user._id]
    })
    await party.populate('hostId', 'username displayName avatarUrl')
    await party.populate('contentItemId', 'title type posterUrl')
    res.status(201).json({ party })

    // Send confirmation email to host (fire-and-forget)
    if (req.user.email) {
      sendWatchPartyConfirmation({
        email: req.user.email,
        displayName: req.user.displayName || req.user.username,
        partyTitle: party.title,
        contentTitle: party.contentItemId?.title || '',
        scheduledAt: party.scheduledAt,
        partyUrl: `${BASE_URL}/watch-party/${party._id}`
      }).catch(() => {})
    }
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getById = async (req, res) => {
  try {
    const party = await WatchParty.findById(req.params.id)
      .populate('hostId', 'username displayName avatarUrl')
      .populate('contentItemId', 'title type posterUrl description')
      .populate('participants', 'username displayName avatarUrl')
      .populate('invites', 'username displayName avatarUrl')
      .populate('messages.userId', 'username displayName avatarUrl')
    if (!party) return res.status(404).json({ message: 'Watch party not found' })
    res.json({ party })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getMyParties = async (req, res) => {
  try {
    const parties = await WatchParty.find({
      $and: [
        { $or: [{ hostId: req.user._id }, { participants: req.user._id }, { invites: req.user._id }] },
        { status: { $ne: 'ended' } },
        notExpiredFilter
      ]
    })
      .populate('hostId', 'username displayName avatarUrl')
      .populate('contentItemId', 'title type posterUrl')
      .sort({ scheduledAt: 1 })
    res.json({ parties })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getPublicParties = async (req, res) => {
  try {
    const { q } = req.query
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const filter = {
      isPublic: true,
      $and: [
        { $or: [{ status: 'live' }, { status: 'scheduled', scheduledAt: { $gte: today } }] },
        notExpiredFilter
      ]
    }
    if (q && q.trim()) {
      filter.title = { $regex: q.trim(), $options: 'i' }
    }
    const parties = await WatchParty.find(filter)
      .populate('hostId', 'username displayName avatarUrl')
      .populate('contentItemId', 'title type posterUrl')
      .sort({ scheduledAt: 1 })
      .limit(50)
    res.json({ parties })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.update = async (req, res) => {
  const { title, scheduledAt, isPublic, recurrence } = req.body
  if (title === undefined && scheduledAt === undefined && isPublic === undefined && recurrence === undefined) {
    return res.status(400).json({ message: 'title, scheduledAt, isPublic, or recurrence required' })
  }
  try {
    const party = await WatchParty.findOne({ _id: req.params.id, hostId: req.user._id })
    if (!party) return res.status(404).json({ message: 'Party not found or not host' })
    if (party.status === 'ended') return res.status(400).json({ message: 'Cannot edit an ended party' })
    if (title !== undefined) party.title = title
    if (scheduledAt !== undefined) party.scheduledAt = new Date(scheduledAt)
    if (isPublic !== undefined) party.isPublic = !!isPublic
    if (recurrence !== undefined) party.recurrence = recurrence
    await party.save()
    await party.populate('hostId', 'username displayName avatarUrl')
    await party.populate('contentItemId', 'title type posterUrl')
    res.json({ party })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.invite = async (req, res) => {
  const { userIds } = req.body
  try {
    const party = await WatchParty.findOne({ _id: req.params.id, hostId: req.user._id })
    if (!party) return res.status(404).json({ message: 'Party not found or not host' })

    const newInvites = userIds.filter(id => !party.invites.some(i => i.toString() === id))
    if (newInvites.length) {
      party.invites.push(...newInvites)
      await party.save()
      const io = req.app.get('io')
      for (const userId of newInvites) {
        createNotification({ io, recipient: userId, actor: req.user._id, type: 'watchparty_invite', watchPartyId: party._id })
      }

      // Send invite emails (fire-and-forget)
      const contentItem = await party.populate('contentItemId', 'title')
      const invitees = await User.find({ _id: { $in: newInvites }, 'settings.emailNotifications': { $ne: false } }, 'email displayName username')
      const partyUrl = `${BASE_URL}/watch-party/${party._id}`
      for (const invitee of invitees) {
        if (invitee.email) {
          sendWatchPartyInvite({
            email: invitee.email,
            displayName: invitee.displayName || invitee.username,
            hostName: req.user.displayName || req.user.username,
            partyTitle: party.title,
            contentTitle: party.contentItemId?.title || '',
            scheduledAt: party.scheduledAt,
            partyUrl
          }).catch(() => {})
        }
      }
    }
    res.json({ party })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.join = async (req, res) => {
  try {
    const party = await WatchParty.findById(req.params.id)
    if (!party) return res.status(404).json({ message: 'Party not found' })
    if (party.status === 'ended') return res.status(400).json({ message: 'Party has ended' })

    const uid = req.user._id.toString()
    const alreadyIn = party.participants.some(p => p.toString() === uid)
    if (!alreadyIn) {
      party.participants.push(req.user._id)
      await party.save()
      const io = req.app.get('io')
      io?.to(`party:${party._id}`).emit('party:participant_joined', { userId: req.user._id, username: req.user.username })
    }
    res.json({ joined: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.start = async (req, res) => {
  try {
    const party = await WatchParty.findOne({ _id: req.params.id, hostId: req.user._id })
    if (!party) return res.status(404).json({ message: 'Party not found or not host' })
    const now = new Date()
    party.status = 'live'
    party.startedAt = now
    party.expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours from now
    await party.save()

    const io = req.app.get('io')
    io?.to(`party:${party._id}`).emit('party:started', { partyId: party._id })

    // Notify all participants
    for (const uid of party.participants) {
      createNotification({ io, recipient: uid, actor: req.user._id, type: 'watchparty_start' })
    }
    res.json({ status: 'live' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.end = async (req, res) => {
  try {
    const party = await WatchParty.findOne({ _id: req.params.id, hostId: req.user._id })
    if (!party) return res.status(404).json({ message: 'Party not found or not host' })
    party.status = 'ended'
    await party.save()
    const io = req.app.get('io')
    io?.to(`party:${party._id}`).emit('party:ended', { partyId: party._id })

    // Auto-schedule next occurrence for recurring parties
    if (party.recurrence && party.recurrence !== 'none') {
      const nextScheduledAt = calculateNextOccurrence(party.scheduledAt, party.recurrence)
      await WatchParty.create({
        title: party.title,
        hostId: party.hostId,
        contentItemId: party.contentItemId,
        scheduledAt: nextScheduledAt,
        isPublic: party.isPublic,
        recurrence: party.recurrence,
        participants: [party.hostId]
      })
    }

    res.json({ status: 'ended' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.rsvp = async (req, res) => {
  const { action } = req.body // 'accept' | 'decline'
  if (!['accept', 'decline'].includes(action)) {
    return res.status(400).json({ message: "action must be 'accept' or 'decline'" })
  }
  try {
    const party = await WatchParty.findById(req.params.id)
    if (!party) return res.status(404).json({ message: 'Party not found' })
    if (party.status === 'ended') return res.status(400).json({ message: 'Party has ended' })

    const uid = req.user._id.toString()
    const isHost = party.hostId.toString() === uid
    const isInvited = party.invites.some(i => i.toString() === uid)
    const isParticipant = party.participants.some(p => p.toString() === uid)

    if (isHost) return res.status(403).json({ message: 'Host cannot change RSVP' })
    if (!isInvited && !isParticipant) return res.status(403).json({ message: 'Not invited to this party' })

    // Remove from invites regardless
    party.invites = party.invites.filter(i => i.toString() !== uid)

    if (action === 'accept') {
      if (!isParticipant) {
        party.participants.push(req.user._id)
        const io = req.app.get('io')
        io?.to(`party:${party._id}`).emit('party:participant_joined', { userId: req.user._id, username: req.user.username })
      }
      // already a participant — no-op (idempotent)
    } else {
      // decline: remove from participants so party disappears from their feed
      party.participants = party.participants.filter(p => p.toString() !== uid)
    }

    await party.save()
    res.json({ action, partyId: party._id })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Called from Socket.io — not an HTTP route
exports.handleMessage = async (io, socket, { partyId, text }) => {
  try {
    const party = await WatchParty.findById(partyId)
    if (!party || party.status !== 'live') return

    // Validate sender is a participant
    const isParticipant = party.participants.some(p => p.toString() === socket.userId?.toString())
    if (!isParticipant) return

    const trimmedText = text.trim().slice(0, 500)
    party.messages.push({ userId: socket.userId, text: trimmedText, createdAt: new Date() })
    await party.save()

    const savedMsg = party.messages[party.messages.length - 1]

    // Fetch user as plain object for clean serialization
    const user = await User.findById(socket.userId, 'username displayName avatarUrl').lean()

    io.to(`party:${partyId}`).emit('party:message', {
      _id: savedMsg._id,
      userId: user || { _id: socket.userId },
      text: savedMsg.text,
      createdAt: savedMsg.createdAt
    })
  } catch (err) {
    console.error('handleMessage error:', err.message)
  }
}
