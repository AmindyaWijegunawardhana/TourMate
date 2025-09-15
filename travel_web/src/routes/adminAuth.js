import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db.js'
import { adminAuthRequired } from '../middleware/auth.js'

const router = express.Router()


router.post('/admin/login', async (req, res, next) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ message: 'username and password are required' })
    }

    
    const [rows] = await pool.query('SELECT * FROM admin WHERE username=?', [username])
    const a = rows[0]
    if (!a) return res.status(401).json({ message: 'Invalid credentials' })

    const ok = await bcrypt.compare(password, a.password)
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' })

    const admin = { id: a.admin_id, username: a.username, role: 'admin' }
    const token = jwt.sign(admin, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })
    res.json({ token, admin })
  } catch (err) {
    next(err)
  }
})


router.get('/admin/me', adminAuthRequired, (req, res) => {
  res.json({ admin: req.admin })
})

export default router
