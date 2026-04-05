const axios = require('axios')

const BASE_URL = 'https://www.googleapis.com/youtube/v3'

// YouTube snippet fields return HTML-encoded strings (e.g. &#39; for apostrophe)
function decodeHtml(str) {
  if (!str) return str
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
}

// Log-scale normalizer: 1M views → ~75, 100M views → 100
function viewCountScore(viewCount) {
  if (!viewCount) return 0
  return Math.min(Math.log10(viewCount + 1) / Math.log10(1e8) * 100, 100)
}

exports.search = async (query) => {
  const { data: searchData } = await axios.get(`${BASE_URL}/search`, {
    params: {
      key: process.env.YOUTUBE_API_KEY,
      q: query,
      part: 'snippet',
      type: 'video',
      maxResults: 20
    }
  })

  const items = searchData.items || []
  const videoIds = items.map(item => item.id.videoId).filter(Boolean)

  // Batch-fetch view/like counts in a single request
  let statsMap = {}
  if (videoIds.length > 0) {
    const { data: statsData } = await axios.get(`${BASE_URL}/videos`, {
      params: {
        key: process.env.YOUTUBE_API_KEY,
        id: videoIds.join(','),
        part: 'statistics'
      }
    })
    for (const v of statsData.items || []) {
      statsMap[v.id] = v.statistics
    }
  }

  return items.map(item => {
    const videoId = item.id.videoId
    const stats = statsMap[videoId] || {}
    const viewCount = parseInt(stats.viewCount || '0', 10)
    return {
      externalId: videoId,
      source: 'youtube',
      type: 'youtube',
      title: decodeHtml(item.snippet.title),
      description: decodeHtml(item.snippet.description),
      posterUrl: item.snippet.thumbnails.high?.url || '',
      releaseDate: item.snippet.publishedAt,
      genres: [],
      creator: decodeHtml(item.snippet.channelTitle),
      popularityScore: viewCountScore(viewCount),
      metadata: { ...item.snippet, statistics: stats }
    }
  })
}
