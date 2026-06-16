/**
 * scripts/install-ytdlp.js
 * Downloads yt-dlp binary at postinstall time.
 * Uses curl or wget. Fails gracefully — server starts anyway
 * and ytdlp.js will throw a clear error on first audio request.
 */
const { execSync, spawnSync } = require('child_process')
const { existsSync, mkdirSync, chmodSync } = require('fs')
const path = require('path')

const BIN_DIR  = path.join(__dirname, '..', 'bin')
const BIN_PATH = path.join(BIN_DIR, 'yt-dlp')
const YT_DLP_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp'

// 1. Check system yt-dlp
const sys = spawnSync('which', ['yt-dlp'], { encoding: 'utf8' })
if (sys.stdout && sys.stdout.trim()) {
  console.log('✓ yt-dlp found at:', sys.stdout.trim())
  process.exit(0)
}

// 2. Check local bin already exists
if (existsSync(BIN_PATH)) {
  console.log('✓ yt-dlp already at', BIN_PATH)
  process.exit(0)
}

// 3. Download binary
console.log('⬇ Downloading yt-dlp...')
try {
  if (!existsSync(BIN_DIR)) mkdirSync(BIN_DIR, { recursive: true })

  // Try curl first, then wget
  const hasCurl = spawnSync('which', ['curl'], { encoding: 'utf8' }).stdout?.trim()
  const hasWget = spawnSync('which', ['wget'], { encoding: 'utf8' }).stdout?.trim()

  if (hasCurl) {
    execSync(`curl -L "${YT_DLP_URL}" -o "${BIN_PATH}"`, { stdio: 'inherit' })
  } else if (hasWget) {
    execSync(`wget -q "${YT_DLP_URL}" -O "${BIN_PATH}"`, { stdio: 'inherit' })
  } else {
    console.warn('⚠ Neither curl nor wget found. yt-dlp not installed.')
    process.exit(0)
  }

  chmodSync(BIN_PATH, 0o755)
  console.log('✓ yt-dlp installed at', BIN_PATH)
} catch (err) {
  // Don't fail the build — server starts, audio routes fail gracefully
  console.warn('⚠ yt-dlp download failed:', err.message)
}
