/**
 * scripts/install-ytdlp.js
 * Downloads the latest yt-dlp binary at postinstall time.
 * Always downloads fresh to ensure iOS client support (needed to bypass
 * YouTube bot detection on cloud/datacenter IPs like Render).
 */
const { execSync, spawnSync } = require('child_process')
const { existsSync, mkdirSync, chmodSync } = require('fs')
const path = require('path')

const BIN_DIR    = path.join(__dirname, '..', 'bin')
const BIN_PATH   = path.join(BIN_DIR, 'yt-dlp')
const YT_DLP_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp'

console.log('⬇ Downloading latest yt-dlp (ensures iOS client support)...')
try {
  if (!existsSync(BIN_DIR)) mkdirSync(BIN_DIR, { recursive: true })

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
  console.warn('⚠ yt-dlp download failed:', err.message)
}
