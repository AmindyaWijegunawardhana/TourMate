import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import pool from './db.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'
import routes from './routes/index.js'  
const app = express()
const PORT = process.env.PORT || 4000

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
    credentials: false
  })
)


app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true, db: 'connected', time: new Date().toISOString() })
  } catch (err) {
    res.status(500).json({ ok: false, db: 'error', error: err.message })
  }
})


app.get('/api/debug/tables', async (req, res) => {
  try {
    const [rows] = await pool.query('SHOW TABLES')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


app.use('/', routes)  


app.use(notFound)
app.use(errorHandler)

/** Start the server */
app.listen(PORT, async () => {
  console.log(`✅ API running at http://localhost:${PORT}`)
  try {
    await pool.query('SELECT 1')
    console.log('✅ Database connected successfully')
  } catch (e) {
    console.error('❌ Database connection failed:', e.message)
  }
})
