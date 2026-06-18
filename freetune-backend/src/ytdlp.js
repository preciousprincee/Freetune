/**
 * src/ytdlp.js
 * yt-dlp integration using Node.js child_process.spawn.
 *
 * Bot detection bypass strategy (in order of preference):
 * 1. YouTube cookies via YOUTUBE_COOKIES env var (most reliable on cloud IPs)
 * 2. iOS player client fallback (works on some IPs without cookies)
 *
 * HOW TO SET UP COOKIES (do this once):
 * 1. Install the "Get cookies.txt LOCALLY" Chrome extension
 * 2. Go to youtube.com while logged into a Google account
 * 3. Click the extension → Export cookies for youtube.com
 * 4. Copy the full contents of the .txt file
 * 5. In Render dashboard → Environment → add YOUTUBE_COOKIES, paste the contents
 *
 * Audio is piped stdout → HTTP response. Nothing is saved to disk.
 */

const { spawn }    = require('child_process')
const { execSync } = require('child_process')
const path         = require('path')
const fs           = require('fs')
const os           = require('os')

const BIN_DIR  = path.join(__dirname, '..', 'bin')
const BIN_PATH = path.join(BIN_DIR, 'yt-dlp')

// Write cookies to a temp file once at startup if env var is set
let COOKIES_FILE = null

function initCookies() {
  const raw = process.env.YOUTUBE_COOKIES
  if (!raw || !raw.trim()) return null

  try {
    const tmpFile = path.join(os.tmpdir(), 'yt-cookies.txt')
    fs.writeFileSync(tmpFile, raw.trim(), { mode: 0o600 })
    console.log('[ytdlp] Cookies loaded from YOUTUBE_COOKIES env var')
    return tmpFile
  } catch (err) {
    console.warn('[ytdlp] Failed to write cookies file:', err.message)
    return null
  }
}

// Initialise once on module load
COOKIES_FILE = initCookies()

function getYtDlpBin() {
  if (fs.existsSync(BIN_PATH)) return BIN_PATH
  try {
    const systemPath = execSync('which yt-dlp', { encoding: 'utf8' }).trim()
    if (systemPath) return systemPath
  } catch {}
  throw new Error('yt-dlp binary not found. Run: npm run postinstall')
}

function buildArgs(videoId, extraArgs = []) {
  const url = `https://www.youtube.com/watch?v=${videoId}`

  const args = [
    url,
    '--no-playlist',
    '--quiet',
    '--no-warnings',
    '--no-cache-dir',
  ]

  // Prefer cookies if available — most reliable on cloud IPs
  if (COOKIES_FILE) {
    args.push('--cookies', COOKIES_FILE)
  } else {
    // Fallback: iOS client avoids some bot detection without cookies
    args.push('--extractor-args', 'youtube:player_client=ios,android,web')
  }

  return [...args, ...extraArgs]
}

/**
 * getAudioStream
 * Spawns yt-dlp and returns the ChildProcess.
 * Caller pipes process.stdout → HTTP response.
 *
 * @param {string} videoId  YouTube video ID (11 chars)
 * @returns {ChildProcess}
 */
function getAudioStream(videoId) {
  const bin  = getYtDlpBin()
  const args = buildArgs(videoId, [
    '--format',        'bestaudio[ext=m4a]/bestaudio/best',
    '--extract-audio',
    '--audio-format',  'mp3',
    '--audio-quality', '128K',
    '--output',        '-',
  ])

  const proc = spawn(bin, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  proc.stderr.on('data', d => {
    const msg = d.toString().trim()
    if (msg) console.error(`[yt-dlp] ${msg}`)
  })

  return proc
}

/**
 * getVideoInfo
 * Returns JSON metadata for a single video.
 *
 * @param {string} videoId
 * @returns {Promise<object>}
 */
function getVideoInfo(videoId) {
  return new Promise((resolve, reject) => {
    const bin  = getYtDlpBin()
    const args = buildArgs(videoId, ['--dump-json'])

    const proc = spawn(bin, args, {
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
