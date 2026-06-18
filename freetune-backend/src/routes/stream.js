const router = require('express').Router()
const { getAudioUrl } = require('../piped')

router.get('/:videoId', async (req, res) => {
  const { videoId } = req.params
  if (!videoId || !/^[\w-]{11}$/.test(videoId))
    return res.status(400).json({ error: 'Invalid video ID' })

  let audioUrl, mimeType
  try {
    ;({ url: audioUrl, mimeType } = await getAudioUrl(videoId))
  } catch (err) {
    console.error('[stream] Piped failed:', err.message)
    return res.status(503).json({ error: 'Could not resolve audio stream. Try again.' })
  }

  let upstream
  try {
    upstream = await fetch(audioUrl, {
      signal: AbortSignal.timeout(15000),
      headers: {
        ...(req.headers.range ? { Range: req.headers.range } : {}),
        'User-Agent': 'Mozilla/5.0',
        Referer: 'https://www.youtube.com/',
      },
    })
    if (!upstream.ok) throw new Error(`Upstream HTTP ${upstream.status}`)
  } catch (err) {
    console.error('[stream] Upstream fetch failed:', err.message)
    return res.status(502).json({ error: 'Failed to fetch audio stream' })
  }

  const status = upstream.status === 206 ? 206 : 200
  res.status(status)
  res.setHeader('Content-Type', mimeType || 'audio/mp4')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Accept-Ranges', 'bytes')

  const contentRange  = upstream.headers.get('content-range')
  const contentLength = upstream.headers.get('content-length')
  if (contentRange)  res.setHeader('Content-Range', contentRange)
  if (contentLength) res.setHeader('Content-Length', contentLength)

  const { Readable } = require('stream')
  Readable.fromWeb(upstream.body).pipe(res)

  req.on('close', () => res.destroy())
})

module.exports = router
