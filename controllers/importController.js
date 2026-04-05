const multer = require('multer')
const tmdbService = require('../services/tmdbService')
const { ContentItem, Rating, Review } = require('../models')

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })
exports.upload = upload.single('file')

// ── CSV parser (handles quoted fields) ──────────────────────────────────────

function parseCSVRow(row) {
  const fields = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < row.length; i++) {
    if (row[i] === '"') {
      inQuotes = !inQuotes
    } else if (row[i] === ',' && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += row[i]
    }
  }
  fields.push(current.trim())
  return fields
}

function parseCSV(text) {
  const lines = text.split('\n').map(l => l.trimEnd()).filter(Boolean)
  if (lines.length < 2) return []
  const headers = parseCSVRow(lines[0]).map(h => h.trim())
  return lines.slice(1).map(line => {
    const values = parseCSVRow(line)
    const row = {}
    headers.forEach((h, i) => { row[h] = (values[i] || '').trim() })
    return row
  })
}

function detectFormat(headers) {
  if (headers.some(h => h === 'Const' || h === 'Your Rating')) return 'imdb'
  if (headers.some(h => h === 'Letterboxd URI' || h === 'Name')) return 'letterboxd'
  return null
}

// ── TMDB title matcher ───────────────────────────────────────────────────────

async function findContent(title, year, type) {
  try {
    const tmdbType = type === 'tv' ? 'tv' : 'movie'
    const results = await tmdbService.search(title, tmdbType)
    if (!results.length) return null
    // Prefer exact year match, fall back to first result
    const match = results.find(r => {
      if (!r.releaseDate) return false
      const y = new Date(r.releaseDate).getFullYear()
      return y === Number(year)
    }) || results[0]
    return match
  } catch {
    return null
  }
}

async function upsertContentItem(normalized) {
  if (!normalized) return null
  return ContentItem.findOneAndUpdate(
    { externalId: normalized.externalId, source: normalized.source },
    { $set: normalized },
    { upsert: true, new: true }
  )
}

// ── Process rows ─────────────────────────────────────────────────────────────

async function processRow(row, format, userId) {
  let title, year, score, reviewText, type

  if (format === 'letterboxd') {
    title      = row['Name'] || row['Film']
    year       = row['Year']
    const raw  = parseFloat(row['Rating'])
    score      = !isNaN(raw) ? Math.round(raw * 2) : null  // 0.5–5 → 1–10
    reviewText = row['Review'] || null
    type       = 'movie'
  } else {
    title      = row['Title']
    year       = row['Year']
    score      = parseInt(row['Your Rating'], 10) || null
    reviewText = null
    const tt   = (row['Title Type'] || '').toLowerCase()
    type       = tt.includes('tv') || tt.includes('series') ? 'tv' : 'movie'
  }

  if (!title) return { status: 'skipped', reason: 'no title' }

  const normalized = await findContent(title, year, type)
  if (!normalized) return { status: 'skipped', title, reason: 'not found on TMDB' }

  const contentItem = await upsertContentItem(normalized)
  if (!contentItem) return { status: 'skipped', title, reason: 'db upsert failed' }

  // Upsert rating
  if (score && score >= 1 && score <= 10) {
    const { Rating: RatingModel } = require('../models')
    await RatingModel.findOneAndUpdate(
      { userId, contentItemId: contentItem._id },
      { $set: { score } },
      { upsert: true }
    )
    // Update ContentItem average
    const { Rating: R } = require('../models')
    const stats = await R.aggregate([
      { $match: { contentItemId: contentItem._id } },
      { $group: { _id: null, avg: { $avg: '$score' }, count: { $sum: 1 } } }
    ])
    if (stats[0]) {
      await ContentItem.findByIdAndUpdate(contentItem._id, {
        $set: { averageRating: Math.round(stats[0].avg * 10) / 10, totalRatings: stats[0].count }
      })
    }
  }

  // Create review if present
  if (reviewText) {
    await Review.findOneAndUpdate(
      { userId, contentItemId: contentItem._id },
      { $setOnInsert: { userId, contentItemId: contentItem._id, body: reviewText, rating: score || null } },
      { upsert: true }
    )
  }

  return { status: 'imported', title: contentItem.title }
}

// ── Controller ───────────────────────────────────────────────────────────────

exports.importCSV = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' })

  try {
    const text = req.file.buffer.toString('utf-8')
    const rows = parseCSV(text)
    if (!rows.length) return res.status(400).json({ message: 'CSV is empty or unreadable' })

    const format = detectFormat(Object.keys(rows[0]))
    if (!format) return res.status(400).json({ message: 'Unrecognized CSV format. Use Letterboxd or IMDb export.' })

    // Process up to 5 rows in parallel, chunked
    const results = []
    const CHUNK = 5
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK)
      const settled = await Promise.allSettled(chunk.map(row => processRow(row, format, req.user._id)))
      settled.forEach(r => results.push(r.status === 'fulfilled' ? r.value : { status: 'error', reason: r.reason?.message }))
    }

    const imported = results.filter(r => r.status === 'imported').length
    const skipped  = results.filter(r => r.status === 'skipped').length
    const errors   = results.filter(r => r.status === 'error').length

    res.json({ imported, skipped, errors, total: rows.length, details: results })
  } catch (err) {
    console.error('Import error:', err.message)
    res.status(500).json({ message: 'Import failed: ' + err.message })
  }
}
