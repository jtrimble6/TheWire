const { ContentItem, Community, Review } = require('../models')
const tmdbService = require('../services/tmdbService')
const spotifyService = require('../services/spotifyService')
const youtubeService = require('../services/youtubeService')
const podcastService = require('../services/podcastService')

// ─── Search intelligence helpers ─────────────────────────────────────────────

// Ordered most-specific to least-specific so 'tv show' matches before 'show'
const TYPE_SIGNALS = [
  { keywords: ['tv show', 'tv series', 'television show'],  type: 'tv',      strong: true  },
  { keywords: ['podcast'],                                   type: 'podcast', strong: true  },
  { keywords: ['movie', 'film'],                             type: 'movie',   strong: true  },
  { keywords: ['song', 'track'],                             type: 'music',   strong: true  },
  { keywords: ['youtube', 'youtuber'],                       type: 'youtube', strong: true  },
  { keywords: ['album', 'band', 'artist', 'singer'],         type: 'music',   strong: false },
  { keywords: ['series', 'season', 'episode'],               type: 'tv',      strong: false }
]

/**
 * Detect content-type intent from a free-text query.
 * Returns the inferred type, a "clean" query with the intent keyword stripped,
 * and whether the detection was unambiguous (strong).
 */
function parseSearchIntent(query) {
  const lower = query.toLowerCase()
  for (const { keywords, type, strong } of TYPE_SIGNALS) {
    for (const kw of keywords) {
      if (new RegExp(`\\b${kw}s?\\b`).test(lower)) {
        const clean = query
          .replace(new RegExp(`\\b${kw}s?\\b`, 'gi'), '')
          .trim()
          .replace(/\s{2,}/g, ' ')
        return { detectedType: type, cleanQuery: clean || query, strong }
      }
    }
  }
  return { detectedType: null, cleanQuery: query, strong: false }
}

/**
 * Extract a 4-digit year (1950–2029) from a query.
 * Returns the year (or null) and the query with the year token removed.
 */
function extractYear(query) {
  const match = query.match(/\b(19[5-9]\d|20[0-2]\d)\b/)
  if (!match) return { year: null, cleanQuery: query }
  const clean = query.replace(match[0], '').trim().replace(/\s{2,}/g, ' ')
  return { year: parseInt(match[1], 10), cleanQuery: clean || query }
}

/**
 * Normalize a title/query for fuzzy comparison:
 * lowercase, strip leading articles, remove non-alphanumeric except spaces.
 */
function normalizeForMatch(s) {
  return s.toLowerCase()
    .replace(/^(the|a|an)\s+/i, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

/**
 * Score how well a content title matches the user's query (0–100).
 * Favours exact matches, then normalized matches (articles stripped),
 * then progressive partial matches, then word overlap.
 */
function titleRelevanceScore(title, query) {
  if (!title || !query) return 0
  const t = title.toLowerCase().trim()
  const q = query.toLowerCase().trim()

  // Exact match
  if (t === q) return 100

  // Normalized exact match (strip articles like "The", "A", "An" + punctuation)
  const tn = normalizeForMatch(title)
  const qn = normalizeForMatch(query)
  if (tn === qn && tn.length > 0) return 98

  // Prefix / contains matches on raw
  if (t.startsWith(q))  return 92
  if (q.startsWith(t))  return 85
  if (t.includes(q))    return 78

  // Prefix / contains matches on normalized
  if (tn.startsWith(qn) && qn.length > 0) return 83
  if (qn.startsWith(tn) && tn.length > 0) return 80
  if (tn.includes(qn)   && qn.length > 0) return 73

  // Word-overlap fallback
  const qWords = q.split(/\s+/).filter(w => w.length > 1)
  if (qWords.length === 0) return 20
  const tWords = new Set(t.split(/\s+/))
  const hits = qWords.filter(w => tWords.has(w) || [...tWords].some(tw => tw.startsWith(w)))
  return Math.round((hits.length / qWords.length) * 65)
}

/**
 * Compute a final ranking score using a tier system so title relevance quality
 * always beats popularity — popularity is a tiebreaker within the same tier.
 *
 * Tiers (250 apart):
 *   1000 — exact / normalized-exact match (rel ≥ 98)
 *    750 — near-exact: starts with query (rel ≥ 85)
 *    500 — title contains query (rel ≥ 70)
 *    250 — partial word overlap (rel < 70)
 *
 * Max within-tier bonus = pop (0–100) + typeBoost (0–10) + yearBoost (0–20) = 130
 * Tier gap = 250, so no popularity delta can ever bridge tiers.
 */
function computeFinalScore(item, cleanQuery, detectedType, detectedYear) {
  const rel = titleRelevanceScore(item.title, cleanQuery)
  const pop = Math.min(item.popularityScore || 0, 100)
  const typeBoost = (detectedType && item.type === detectedType) ? 10 : 0
  const yearBoost = (detectedYear && item.year === detectedYear) ? 20 : 0

  let tier
  if (rel >= 98)       tier = 1000
  else if (rel >= 85)  tier = 750
  else if (rel >= 70)  tier = 500
  else                 tier = 250

  return tier + pop + typeBoost + yearBoost
}

// ─────────────────────────────────────────────────────────────────────────────

async function upsertContentItem(normalized) {
  if (!normalized) return null
  return ContentItem.findOneAndUpdate(
    { externalId: normalized.externalId, source: normalized.source },
    { $set: normalized },
    { upsert: true, new: true }
  )
}

async function safeSearch(label, fn) {
  try {
    return await fn()
  } catch (err) {
    console.warn(`${label} search failed:`, err.message)
    return []
  }
}

exports.search = async (req, res) => {
  const { q, type, provider } = req.query
  if (!q) return res.status(400).json({ message: 'Query parameter q is required' })

  try {
    // Provider-scoped search: TMDB movie + TV only, filtered to that streaming service
    if (provider) {
      const providerId = parseInt(provider, 10)
      if (isNaN(providerId)) return res.status(400).json({ message: 'provider must be a numeric TMDB provider ID' })
      const results = await tmdbService.searchWithProvider(q, providerId)
      const saved = await Promise.all(results.map(item => upsertContentItem(item).catch(() => null)))
      return res.json({ results: saved.filter(Boolean) })
    }

    // Detect content-type intent (e.g. "inception movie", "joe rogan podcast")
    const { detectedType, cleanQuery: typeStripped, strong } = parseSearchIntent(q)

    // Extract year from query if present (e.g. "hardball 2001")
    const { year: detectedYear, cleanQuery } = extractYear(typeStripped)

    // Explicit UI type filter takes precedence; fall back to auto-detected type when strong
    const activeType = type || (strong ? detectedType : null)

    // Standard multi-source search — use cleanQuery for API calls so stripping
    // intent keywords (e.g. "movie") doesn't confuse title-based search APIs
    const searches = []

    if (!activeType || activeType === 'movie' || activeType === 'tv') {
      const tmdbType = activeType === 'movie' || activeType === 'tv' ? activeType : 'multi'
      searches.push(safeSearch('TMDB', () => tmdbService.search(cleanQuery, tmdbType)))
    }
    if (!activeType || activeType === 'music') {
      searches.push(safeSearch('Spotify', () => spotifyService.search(cleanQuery)))
    }
    if (!activeType || activeType === 'youtube') {
      searches.push(safeSearch('YouTube', () => youtubeService.search(cleanQuery)))
    }
    if (!activeType || activeType === 'podcast') {
      searches.push(safeSearch('PodcastIndex', () => podcastService.search(cleanQuery)))
      searches.push(safeSearch('SpotifyPodcasts', () => spotifyService.searchPodcasts(cleanQuery)))
    }

    const settled = await Promise.all(searches)
    const results = settled.flat()

    const saved = await Promise.all(results.map(item => upsertContentItem(item).catch(() => null)))
    const docs = saved.filter(Boolean)

    // Rank by combined relevance + popularity + type-match + year boost.
    docs.sort((a, b) => {
      const diff = computeFinalScore(b, cleanQuery, detectedType, detectedYear) - computeFinalScore(a, cleanQuery, detectedType, detectedYear)
      if (Math.abs(diff) > 0.5) return diff
      if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating
      return (b.totalReviews || 0) - (a.totalReviews || 0)
    })

    res.json({ results: docs })
  } catch (err) {
    console.error('Search error:', err.message)
    res.status(500).json({ message: 'Search failed' })
  }
}

exports.getById = async (req, res) => {
  try {
    const item = await ContentItem.findById(req.params.id)
    if (!item) return res.status(404).json({ message: 'Content not found' })
    res.json({ item })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getContentMeta = async (req, res) => {
  try {
    const contentItemId = req.params.id
    const [communities, topReviewers] = await Promise.all([
      Community.find({ contentItemId })
        .select('name slug memberCount')
        .sort({ memberCount: -1 })
        .limit(5),
      Review.find({ contentItemId })
        .sort({ likes: -1 })
        .limit(10)
        .populate('userId', 'username displayName avatarUrl')
        .select('title body likes containsSpoilers commentCount userId createdAt')
    ])
    res.json({ communities, topReviewers })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getWatchProviders = async (req, res) => {
  try {
    const item = await ContentItem.findById(req.params.id).select('type externalId source title')
    if (!item) return res.status(404).json({ message: 'Content not found' })

    const { type, externalId, source, title } = item

    if (type === 'movie' || type === 'tv') {
      const data = await tmdbService.getWatchProviders(externalId, type)
      return res.json({ type, ...data })
    }

    if (type === 'youtube') {
      return res.json({
        type,
        streaming: [{ id: 'youtube', name: 'YouTube', logo: null, url: `https://www.youtube.com/watch?v=${externalId}` }],
        rent: [], buy: [], justWatchLink: null
      })
    }

    if (type === 'music') {
      return res.json({
        type,
        streaming: [{ id: 'spotify', name: 'Spotify', logo: null, url: `https://open.spotify.com/track/${externalId}` }],
        rent: [], buy: [], justWatchLink: null
      })
    }

    if (type === 'album') {
      return res.json({
        type,
        streaming: [{ id: 'spotify', name: 'Spotify', logo: null, url: `https://open.spotify.com/album/${externalId}` }],
        rent: [], buy: [], justWatchLink: null
      })
    }

    if (type === 'podcast') {
      const url = source === 'spotify'
        ? `https://open.spotify.com/show/${externalId}`
        : `https://open.spotify.com/search/${encodeURIComponent(title)}`
      return res.json({
        type,
        streaming: [{ id: 'spotify', name: 'Spotify', logo: null, url }],
        rent: [], buy: [], justWatchLink: null
      })
    }

    res.json({ type, streaming: [], rent: [], buy: [], justWatchLink: null })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.browseByProvider = async (req, res) => {
  const { provider, mediaType = 'movie', page = 1 } = req.query
  if (!provider) return res.status(400).json({ message: 'provider is required' })

  const providerId = parseInt(provider, 10)
  if (isNaN(providerId)) return res.status(400).json({ message: 'provider must be a numeric TMDB provider ID' })

  try {
    const { results, totalPages, page: currentPage } = await tmdbService.discoverByProvider(providerId, mediaType, parseInt(page, 10))
    const saved = await Promise.all(results.map(item => upsertContentItem(item).catch(() => null)))
    const docs = saved.filter(Boolean)
    res.json({ results: docs, totalPages, page: currentPage })
  } catch (err) {
    console.error('Browse by provider error:', err.message)
    res.status(500).json({ message: 'Failed to fetch provider catalog' })
  }
}

exports.getRecommendations = async (req, res) => {
  try {
    const item = await ContentItem.findById(req.params.id)
    if (!item) return res.status(404).json({ message: 'Content not found' })

    let normalized = []

    if (item.source === 'tmdb' && (item.type === 'movie' || item.type === 'tv')) {
      normalized = await tmdbService.getRecommendations(item.externalId, item.type)
    } else if (item.source === 'spotify' && item.type === 'music') {
      normalized = await spotifyService.getTrackRecommendations(item.externalId)
    } else {
      // Fallback: find similar content from our own DB by type + overlapping genres
      const query = { _id: { $ne: item._id }, type: item.type }
      if (item.genres?.length > 0) query.genres = { $in: item.genres }
      const similar = await ContentItem.find(query)
        .sort({ popularityScore: -1, averageRating: -1 })
        .limit(12)
      return res.json({ results: similar })
    }

    const saved = await Promise.all(normalized.map(n => upsertContentItem(n).catch(() => null)))
    res.json({ results: saved.filter(Boolean) })
  } catch (err) {
    console.error('Recommendations error:', err.message)
    res.status(500).json({ message: 'Failed to load recommendations' })
  }
}

exports.getTrending = async (req, res) => {
  try {
    const items = await ContentItem.find()
      .sort({ popularityScore: -1, averageRating: -1, totalReviews: -1 })
      .limit(20)
    res.json({ items })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
