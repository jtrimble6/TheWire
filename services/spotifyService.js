const axios = require('axios')

let accessToken = null
let tokenExpiry = null

async function getToken() {
  if (accessToken && tokenExpiry > Date.now()) return accessToken
  const { data } = await axios.post(
    'https://accounts.spotify.com/api/token',
    'grant_type=client_credentials',
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')
      }
    }
  )
  accessToken = data.access_token
  tokenExpiry = Date.now() + data.expires_in * 1000
  return accessToken
}

exports.search = async (query, type = 'track,album,artist') => {
  const token = await getToken()
  const { data } = await axios.get('https://api.spotify.com/v1/search', {
    params: { q: query, type, limit: 20 },
    headers: { Authorization: `Bearer ${token}` }
  })
  const results = []
  if (data.tracks) {
    data.tracks.items.forEach(t => results.push({
      externalId: t.id, source: 'spotify', type: 'music',
      title: t.name, description: t.artists.map(a => a.name).join(', '),
      posterUrl: t.album.images[0]?.url || '', releaseDate: t.album.release_date || null,
      genres: [], creator: t.artists[0]?.name || '',
      popularityScore: t.popularity || 0,  // Spotify already returns 0–100
      metadata: t
    }))
  }
  return results
}

exports.getTrackRecommendations = async (trackId) => {
  const token = await getToken()
  const { data } = await axios.get('https://api.spotify.com/v1/recommendations', {
    params: { seed_tracks: trackId, limit: 12, market: 'US' },
    headers: { Authorization: `Bearer ${token}` }
  })
  return (data.tracks || []).map(t => ({
    externalId: t.id,
    source: 'spotify',
    type: 'music',
    title: t.name,
    description: t.artists.map(a => a.name).join(', '),
    posterUrl: t.album.images[0]?.url || '',
    releaseDate: t.album.release_date || null,
    genres: [],
    creator: t.artists[0]?.name || '',
    popularityScore: t.popularity || 0,
    metadata: t
  }))
}

exports.searchPodcasts = async (query) => {
  const token = await getToken()
  const { data } = await axios.get('https://api.spotify.com/v1/search', {
    params: { q: query, type: 'show', limit: 20, market: 'US' },
    headers: { Authorization: `Bearer ${token}` }
  })
  return (data.shows?.items || []).map(show => ({
    externalId: show.id,
    source: 'spotify',
    type: 'podcast',
    title: show.name,
    description: show.description || '',
    posterUrl: show.images[0]?.url || '',
    releaseDate: null,
    genres: show.genres || [],
    creator: show.publisher || '',
    // Shows lack a popularity field; use total_episodes as a proxy (200+ episodes → 100)
    popularityScore: Math.min((show.total_episodes || 0) / 2, 100),
    metadata: show
  }))
}
