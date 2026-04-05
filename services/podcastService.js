const axios = require('axios')
const crypto = require('crypto')

const BASE_URL = 'https://api.podcastindex.org/api/1.0'

function decodeHtml(str) {
  if (!str) return str
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(parseInt(c, 10)))
}

function getHeaders() {
  const apiKey = process.env.PODCAST_INDEX_API_KEY
  const apiSecret = process.env.PODCAST_INDEX_API_SECRET
  const apiHeaderTime = Math.floor(Date.now() / 1000)
  const hash = crypto.createHash('sha1')
    .update(apiKey + apiSecret + apiHeaderTime)
    .digest('hex')
  return {
    'X-Auth-Key': apiKey,
    'X-Auth-Date': String(apiHeaderTime),
    'Authorization': hash,
    'User-Agent': 'TheWireApp/1.0'
  }
}

exports.search = async (query) => {
  const { data } = await axios.get(`${BASE_URL}/search/byterm`, {
    params: { q: query, max: 20 },
    headers: getHeaders()
  })
  return (data.feeds || []).map(feed => ({
    externalId: String(feed.id),
    source: 'podcastindex',
    type: 'podcast',
    title: decodeHtml(feed.title),
    description: decodeHtml(feed.description || ''),
    posterUrl: feed.artwork || feed.image || '',
    releaseDate: null,
    genres: [feed.categories ? Object.values(feed.categories)[0] : ''].filter(Boolean),
    creator: decodeHtml(feed.author || ''),
    // episodeCount is the best available signal; 1000+ episodes → 100
    popularityScore: Math.min((feed.episodeCount || 0) / 10, 100),
    metadata: feed
  }))
}
