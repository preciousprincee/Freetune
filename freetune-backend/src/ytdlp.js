/**
 * src/ytdlp.js
 * yt-dlp integration using Node.js child_process.spawn directly.
 * This gives us reliable stdout piping without depending on yt-dlp-wrap's
 * streaming API (which changed across versions).
 *
 * On Railway: yt-dlp is installed via the postinstall script (curl from GitHub).
 * Audio is piped stdout → HTTP response. Nothing is saved to disk.
 * Standard quality: 128kbps MP3 — good balance of size and quality for mobile.
 */

const { spawn }   = require('child_process')
const { execSync } = require('child_process')
const path         = require('path')
const fs           = require('fs')

let ffmpegStaticPath = null
try {
  ffmpegStaticPath = require('ffmpeg-static')
} catch {
  // package not installed — fall back to checking system ffmpeg
}

const BIN_DIR  = path.join(__dirname, '..', 'bin')
const BIN_PATH = path.join(BIN_DIR, 'yt-dlp')

/**
 * getYtDlpBin
 * Returns the path to the yt-dlp binary.
 * Prefers: local bin/ → system PATH
 */
function getYtDlpBin() {
  if (fs.existsSync(BIN_PATH)) return BIN_PATH
  // Try system-installed yt-dlp (available on some hosts)
  try {
    const systemPath = execSync('which yt-dlp', { encoding: 'utf8' }).trim()
    if (systemPath) return systemPath
  } catch {}
  throw new Error('yt-dlp binary not found. Run: npm run postinstall')
}

/**
 * getFfmpegPath
 * Returns a usable ffmpeg path, preferring the bundled ffmpeg-static
 * binary (works on any host, no system install needed) and falling
 * back to a system-installed ffmpeg if present.
 * Returns null if neither is available.
 */
function getFfmpegPath() {
  if (ffmpegStaticPath && fs.existsSync(ffmpegStaticPath)) return ffmpegStaticPath
  try {
    const systemPath = execSync('which ffmpeg', { encoding: 'utf8' }).trim()
    if (systemPath) return systemPath
  } catch {}
  return null
}

function hasFfmpeg() {
  return getFfmpegPath() !== null
}

/**
 * getAudioStream
 * Spawns yt-dlp and returns the ChildProcess + the actual content-type
 * being streamed, so the route handler can set correct headers.
 *
 * IMPORTANT: --extract-audio / --audio-format mp3 require ffmpeg to be
 * installed on the host. If ffmpeg is missing, those flags make yt-dlp
 * download successfully and then fail silently at the conversion step,
 * producing an empty/broken stream — which looks like "song won't play"
 * on the frontend with no clear error.
 *
 * To avoid depending on ffmpeg being present on every host, we stream
 * the best native audio format directly (no re-encode) when ffmpeg is
 * unavailable, and only request an mp3 re-encode when ffmpeg is present.
 *
 * @param {string} videoId  YouTube video ID (11 chars)
 * @returns {{ proc: ChildProcess, contentType: string }}
 */
function getAudioStream(videoId) {
  const bin        = getYtDlpBin()
  const url        = `https://www.youtube.com/watch?v=${videoId}`
  const ffmpegPath = getFfmpegPath()
  const ffmpegOk   = ffmpegPath !== null

  const args = [
    url,
    '--no-playlist',
    '--output',        '-',          // pipe to stdout
    '--quiet',
    '--no-warnings',
    '--no-cache-dir',
    // Spoof a real browser — required or YouTube returns 403 on many videos
    '--add-header',    'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    '--add-header',    'Accept-Language:en-US,en;q=0.9',
    // Client order matters a lot here. YouTube's "Sign in to confirm
    // you're not a bot" challenge is triggered per-client, and which
    // clients get flagged shifts over time as YouTube adjusts its
    // detection. tv_embedded and ios currently tend to dodge this
    // check more often than web/android from datacenter IPs (which is
    // what Render/Railway/etc. all are). Listing several lets yt-dlp
    // fall through to the next one if an earlier client gets challenged.
    '--extractor-args', 'youtube:player_client=tv,ios,android,web',
  ]

  let contentType = 'audio/mp4' // native m4a default when no ffmpeg

  if (ffmpegOk) {
    args.push(
      '--ffmpeg-location', ffmpegPath,
      '--format',         'bestaudio[ext=m4a]/bestaudio/best',
      '--extract-audio',
      '--audio-format',   'mp3',
      '--audio-quality',  '128K',
    )
    contentType = 'audio/mpeg'
  } else {
    // No ffmpeg available — stream the native bestaudio format with no
    // re-encoding. m4a (AAC) plays natively in every modern browser,
    // so prefer it; fall back to opus/webm if m4a isn't offered.
    args.push('--format', 'bestaudio[ext=m4a]/bestaudio')
    console.warn('[yt-dlp] ffmpeg not found — streaming native audio without mp3 conversion.')
  }

  const proc = spawn(bin, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  // Log stderr for debugging but don't block
  proc.stderr.on('data', d => {
    const msg = d.toString().trim()
    if (msg) console.error(`[yt-dlp] ${msg}`)
  })

  return { proc, contentType }
}

/**
 * getVideoInfo
 * Returns JSON metadata for a single video.
 * Used for getting title/thumbnail when needed.
 *
 * @param {string} videoId
 * @returns {Promise<object>}
 */
function getVideoInfo(videoId) {
  return new Promise((resolve, reject) => {
    const bin  = getYtDlpBin()
    const url  = `https://www.youtube.com/watch?v=${videoId}`
    const proc = spawn(bin, [url, '--dump-json', '--no-playlist', '--quiet', '--no-warnings'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let output = ''
    proc.stdout.on('data', d => output += d.toString())
    proc.on('close', code => {
      if (code !== 0) return reject(new Error(`yt-dlp exited with code ${code}`))
      try { resolve(JSON.parse(output)) }
      catch (e) { reject(new Error('Failed to parse yt-dlp JSON output')) }
    })
    proc.on('error', reject)
  })
}

module.exports = { getAudioStream, getVideoInfo, getYtDlpBin }
