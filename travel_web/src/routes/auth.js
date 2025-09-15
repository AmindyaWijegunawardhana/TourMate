import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db.js'

const router = express.Router()

// Middleware to verify token and role
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'Access denied, no token provided' })

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' })
    req.user = decoded
    next()
  })
}

const restrictToAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied, admin only' })
  next()
}

const restrictToUser = (req, res, next) => {
  if (req.user.role !== 'user') return res.status(403).json({ message: 'Access denied, registered users only' })
  next()
}

// Register route
router.post('/register', async (req, res, next) => {
  try {
    let { username, name, email, password } = req.body
    username = (username || name || '').trim()
    email = (email || '').trim()

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email, password are required' })
    }

    const [dupEmail] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email])
    if (dupEmail.length) return res.status(409).json({ message: 'Email already in use' })

    const [dupUser] = await pool.query('SELECT user_id FROM users WHERE username = ?', [username])
    if (dupUser.length) return res.status(409).json({ message: 'Username already in use' })

    const hash = await bcrypt.hash(password, 10)
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hash]
    )

    const payload = { id: result.insertId, username, email, role: 'user' }
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })
    res.status(201).json({ token, user: payload })
  } catch (err) {
    next(err)
  }
})

// Login route
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' })
    }

    // Admin login with fixed credentials
    if (email === 'admin@example.com' && password === 'adminpassword') { // Replace with hashed password in production
      const [rows] = await pool.query('SELECT * FROM admin WHERE username = ?', ['admin'])
      const admin = rows[0]
      const ok = await bcrypt.compare(password, admin.password)
      if (!ok) return res.status(401).json({ message: 'Invalid credentials' })

      const payload = { id: admin.admin_id, username: admin.username, role: 'admin' }
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })
      return res.json({ token, user: payload })
    }

    // User login
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email])
    const u = rows[0]
    if (!u) return res.status(401).json({ message: 'Invalid credentials' })

    const ok = await bcrypt.compare(password, u.password_hash)
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' })

    const payload = { id: u.user_id, username: u.username, email: u.email, role: 'user' }
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })
    res.json({ token, user: payload })
  } catch (err) {
    next(err)
  }
})

// Admin page route
router.get('/admin', authenticateToken, restrictToAdmin, (req, res) => {
  res.json({ message: 'Welcome to the Admin page' })
})

// Post review route (requires user registration)
router.post('/reviews', authenticateToken, restrictToUser, async (req, res, next) => {
  try {
    const { content } = req.body
    if (!content) return res.status(400).json({ message: 'Review content is required' })

    const [result] = await pool.query(
      'INSERT INTO reviews (user_id, content) VALUES (?, ?)',
      [req.user.id, content]
    )

    res.status(201).json({ message: 'Review posted successfully', reviewId: result.insertId })
  } catch (err) {
    next(err)
  }
})

export default router