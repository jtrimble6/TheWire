const axios = require('axios')

const BASE_URL = 'https://api.themoviedb.org/3'
const API_KEY = process.env.TMDB_API_KEY
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

function normalize(item, type) {
  // TMDB popularity ranges 0–5000+; cap at 500 for the top tier → 0–100
  const popularityScore = Math.min((item.popularity || 0) / 5, 100)
  return {
    externalId: String(item.id),
    source: 'tmdb',
    type,
    title: item.title || item.name,
    description: item.overview || '',
    posterUrl: item.poster_path ? `${IMAGE_BASE}${item.poster_path}` : '',
    releaseDate: item.release_date || item.first_air_date || null,
    genres: [],
    creator: '',
    popularityScore,
    metadata: item
  }
}

exports.search = async (query, type = 'multi') => {
  const { data } = await axios.get(`${BASE_URL}/search/${type}`, {
    params: { api_key: API_KEY, query, language: 'en-US', page: 1 }
  })
  return data.results.map(item => {
    const mediaType = item.media_type || type
    const normalizedType = mediaType === 'movie' ? 'movie' : mediaType === 'tv' ? 'tv' : null
    if (!normalizedType) return null
    return normalize(item, normalizedType)
  }).filter(Boolean)
}

exports.getWatchProviders = async (externalId, type) => {
  const endpoint = type === 'movie' ? 'movie' : 'tv'
  const { data } = await axios.get(`${BASE_URL}/${endpoint}/${externalId}/watch/providers`, {
    params: { api_key: API_KEY }
  })
  const us = data.results?.US || {}
  const mapProvider = (p) => ({
    id: p.provider_id,
    name: p.provider_name,
    logo: p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : null
  })
  return {
    justWatchLink: us.link || null,
    streaming: (us.flatrate || []).map(mapProvider),
    rent: (us.rent || []).map(mapProvider),
    buy: (us.buy || []).map(mapProvider)
  }
}

// TMDB watch provider IDs (US region)
const PROVIDER_IDS = {
  netflix: 8,
  amazon: 9,
  hulu: 15,
  tubi: 73,
  max: 384,
  disney: 337,
  peacock: 386,
  appletv: 350,
  paramount: 531
}

// Some services have multiple TMDB provider IDs (e.g. ad-supported tiers).
// When checking if content is on a provider, accept any of its variants.
const PROVIDER_VARIANTS = {
  8:   [8, 1796],       // Netflix + Netflix Basic with Ads
  9:   [9, 119],        // Amazon Prime Video + Amazon Video
  15:  [15],            // Hulu
  73:  [73],            // Tubi
  384: [384, 1899],     // Max + Max Amazon Channel
  337: [337],           // Disney+
  386: [386, 387],      // Peacock + Peacock Premium
  350: [350],           // Apple TV+
  531: [531, 582]       // Paramount+ + Paramount+ Amazon Channel
}

exports.PROVIDER_IDS = PROVIDER_IDS

exports.discoverByProvider = async (providerId, mediaType = 'movie', page = 1) => {
  const endpoint = mediaType === 'tv' ? 'tv' : 'movie'
  const { data } = await axios.get(`${BASE_URL}/discover/${endpoint}`, {
    params: {
      api_key: API_KEY,
      with_watch_providers: providerId,
      watch_region: 'US',
      sort_by: 'popularity.desc',
      page,
      language: 'en-US'
    }
  })
  return {
    results: data.results.map(item => normalize(item, endpoint)),
    totalPages: data.total_pages,
    page: data.page
  }
}

// Search TMDB (movie + TV) and filter results to those available on a specific provider.
// Uses all results from page 1 (~20 per type) and accepts provider tier variants.
exports.searchWithProvider = async (query, providerId) => {
  const acceptedIds = new Set(PROVIDER_VARIANTS[providerId] || [providerId])

  const [movieRes, tvRes] = await Promise.all([
    axios.get(`${BASE_URL}/search/movie`, { params: { api_key: API_KEY, query, language: 'en-US', page: 1 } }),
    axios.get(`${BASE_URL}/search/tv`,    { params: { api_key: API_KEY, query, language: 'en-US', page: 1 } })
  ])

  const candidates = [
    ...movieRes.data.results.map(item => ({ item, type: 'movie' })),
    ...tvRes.data.results.map(item => ({ item, type: 'tv' }))
  ]

  const settled = await Promise.allSettled(
    candidates.map(async ({ item, type }) => {
      try {
        const providers = await exports.getWatchProviders(String(item.id), type)
        const all = [...providers.streaming, ...providers.rent, ...providers.buy]
        if (!all.some(p => acceptedIds.has(p.id))) return null
        return normalize(item, type)
      } catch {
        return null
      }
    })
  )

  return settled
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value)
}

exports.getRecommendations = async (externalId, type) => {
  const endpoint = type === 'movie' ? 'movie' : 'tv'
  const { data } = await axios.get(`${BASE_URL}/${endpoint}/${externalId}/recommendations`, {
    params: { api_key: API_KEY, language: 'en-US', page: 1 }
  })
  return (data.results || []).slice(0, 12).map(item => normalize(item, endpoint))
}

exports.getDetail = async (id, type) => {
  const endpoint = type === 'movie' ? 'movie' : 'tv'
  const { data } = await axios.get(`${BASE_URL}/${endpoint}/${id}`, {
    params: { api_key: API_KEY, language: 'en-US' }
  })
  return normalize(data, type)
}
