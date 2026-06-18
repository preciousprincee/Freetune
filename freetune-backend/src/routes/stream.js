/**
 * routes/stream.js
 * Uses @distube/ytdl-core — actively maintained ytdl fork that works
 * on server IPs without cookies by using the iOS/Android innertube client.
 */
const router = require('express').Router()
const ytdl   = require('@distube/ytdl-core')

router.get('/:videoId', async (req, res) => {
  const { videoId } = req.params
  if (!videoId || !/^[\w-]{11}$/.test(videoId))
    return res.status(400).json({ error: 'Invalid video ID' })

  const url = `https://www.youtube.com/watch?v=${videoId}`

  if (!ytdl.validateID(videoId)) {
    return res.status(400).json({ error: 'Invalid video ID' })
  }

  try {
    const info    = await ytdl.getInfo(url)
    const format  = ytdl.chooseFormat(info.formats, {
      quality: 'highestaudio',
      filter: 'audioonly',
    })

    res.setHeader('Content-Type', format.mimeType?.split(';')[0] || 'audio/mp4')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Accept-Ranges', 'bytes')
    if (format.contentLength) res.setHeader('Content-Length', format.contentLength)

    const stream = ytdl.downloadFromInfo(info, { format })
    stream.pipe(res)
    stream.on('error', err => {
      console.error('[stream] ytdl error:', err.message)
      if (!res.headersSent) res.status(500).json({ error: 'Stream error' })
    })
    req.on('close', () => stream.destroy())

  } catch (err) {
    console.error('[stream] Failed:', err.message)
    if (!res.headersSent)
      res.status(503).json({ error: 'Could not stream audio. Try again.' })
  }
})

module.exports = router
