const router       = require('express').Router()
const { spawn }    = require('child_process')
const { execSync } = require('child_process')
const { Readable } = require('stream')
const { getAudioUrl } = require('../piped')

function getFfmpegBin() {
  try { return execSync('which ffmpeg', { encoding: 'utf8' }).trim() || 'ffmpeg' }
  catch { return 'ffmpeg' }
}

router.get('/:videoId', async (req, res) => {
  const { videoId } = req.params
  const title     = (req.query.title || 'freetune-audio').substring(0, 100)
  const safeTitle = title.replace(/[^\w\s\-_.]/g, '').trim().replace(/\s+/g, '_') || 'audio'

  if (!videoId || !/^[\w-]{11}$/.test(videoId))
    return res.status(400).json({ error: 'Invalid video ID' })

  let audioUrl
  try {
    ;({ url: audioUrl } = await getAudioUrl(videoId))
  } catch (err) {
    console.error('[download] Piped failed:', err.message)
    return res.status(503).json({ error: 'Could not resolve audio stream. Try again.' })
  }

  let upstream
  try {
    upstream = await fetch(audioUrl, {
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://www.youtube.com/' },
    })
    if (!upstream.ok) throw new Error(`Upstream HTTP ${upstream.status}`)
  } catch (err) {
    console.error('[download] Upstream fetch failed:', err.message)
    return res.status(502).json({ error: 'Failed to fetch audio' })
  }

  const ffmpeg = spawn(getFfmpegBin(), [
    '-i', 'pipe:0',
    '-vn', '-ar', '44100', '-ac', '2', '-b:a', '128k',
    '-f', 'mp3', 'pipe:1',
  ], { stdio: ['pipe', 'pipe', 'pipe'] })

  ffmpeg.stderr.on('data', () => {})
  ffmpeg.on('error', err => {
    console.error('[download] ffmpeg error:', err.message)
    if (!res.headersSent) res.status(500).json({ error: 'Conversion failed' })
  })

  res.setHeader('Content-Type', 'audio/mpeg')
  res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.mp3"`)
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Access-Control-Allow-Origin', '*')

  Readable.fromWeb(upstream.body).pipe(ffmpeg.stdin)
  ffmpeg.stdout.pipe(res)

  req.on('close', () => {
    try { ffmpeg.kill('SIGTERM') } catch {}
  })

  ffmpeg.on('close', code => {
    if (code !== 0) console.error(`[download] ffmpeg exited ${code}`)
    res.end()
  })
})

module.exports = router
