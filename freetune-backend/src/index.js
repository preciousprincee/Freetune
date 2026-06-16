require('dotenv').config()
const express   = require('express')
const cors      = require('cors')
const rateLimit = require('express-rate-limit')

const app  = express()
const PORT = process.env.PORT || 3001

console.log(`[startup] FreeTune API starting on port ${PORT}`)
console.log(`[startup] Node version: ${process.version}`)
console.log(`[startup] Allowed origins: ${process.env.ALLOWED_ORIGINS || 'ALL (open)'}`)

// ── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(o => o.trim()).filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, mobile apps)
    if (!origin) return cb(null, true)
    // Allow all if no restriction set
    if (allowedOrigins.length === 0) return cb(null, true)
    if (allowedOrigins.includes(origin)) return cb(null, true)
    console.warn(`[cors] Blocked origin: ${origin}`)
    cb(new Error('CORS: origin not allowed'))
  },
  methods: ['GET', 'OPTIONS'],
}))

// ── Rate limiting ────────────────────────────────────────────────────────────
app.use('/api/stream',   rateLimit({ windowMs: 60000, max: 30, standardHeaders: true, legacyHeaders: false }))
app.use('/api/download', rateLimit({ windowMs: 60000, max: 10, standardHeaders: true, legacyHeaders: false }))
app.use('/api/search',   rateLimit({ windowMs: 60000, max: 60, standardHeaders: true, legacyHeaders: false }))

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/health',   require('./routes/health'))
app.use('/api/search',   require('./routes/search'))
app.use('/api/stream',   require('./routes/stream'))
app.use('/api/download', require('./routes/download'))

// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.path}`)
  res.status(404).json({ error: 'Not found' })
})

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[error]', err.message)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[startup] ✓ FreeTune API listening on 0.0.0.0:${PORT}`)
})
