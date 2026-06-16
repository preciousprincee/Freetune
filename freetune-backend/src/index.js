/**
 * src/index.js — FreeTune Backend entry point
 */
require('dotenv').config()
const express   = require('express')
const cors      = require('cors')
const rateLimit = require('express-rate-limit')

const app  = express()
const PORT = process.env.PORT || 3001

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(o => o.trim()).filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin))
      return cb(null, true)
    cb(new Error('CORS: origin not allowed'))
  },
  methods: ['GET'],
}))

app.use('/api/stream',   rateLimit({ windowMs: 60000, max: 30,  message: { error: 'Too many requests' } }))
app.use('/api/download', rateLimit({ windowMs: 60000, max: 10,  message: { error: 'Too many requests' } }))
app.use('/api/search',   rateLimit({ windowMs: 60000, max: 60,  message: { error: 'Too many requests' } }))

app.use('/api/health',   require('./routes/health'))
app.use('/api/search',   require('./routes/search'))
app.use('/api/stream',   require('./routes/stream'))
app.use('/api/download', require('./routes/download'))

app.use((req, res) => res.status(404).json({ error: 'Not found' }))
app.use((err, req, res, next) => {
  console.error('[error]', err.message)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () => console.log(`FreeTune API on port ${PORT}`))
