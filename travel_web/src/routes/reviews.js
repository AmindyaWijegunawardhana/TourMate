import express from 'express'
import pool from '../db.js'

const router = express.Router()


router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.review_id, r.user_id, r.destination_id, u.username,
              d.name AS destination_name, r.rating, r.review_text, r.created_at
       FROM reviews r
       JOIN users u ON u.user_id = r.user_id
       JOIN destinations d ON d.destination_id = r.destination_id
       ORDER BY r.review_id DESC`
    )
    res.json(rows.map(r => ({
      id: r.review_id,
      userId: r.user_id,
      destinationId: r.destination_id,
      destinationName: r.destination_name,
      username: r.username,
      rating: r.rating,
      comment: r.review_text,
      date: r.created_at
    })))
  } catch (err) { next(err) }
})


router.post('/', async (req, res, next) => {
  try {
    let { userId, username, name, destinationId, rating, comment, date } = req.body

    
    if (!userId) {
      const handle = (username || name || '').trim()
      if (handle) {
        const [u] = await pool.query('SELECT user_id FROM users WHERE username = ?', [handle])
        if (u.length) userId = u[0].user_id
      }
    }

    if (!userId || !destinationId || !rating || !comment) {
      return res.status(400).json({ message: 'userId (or username), destinationId, rating, comment are required' })
    }

    const n = Number(rating)
    if (n < 1 || n > 5) return res.status(400).json({ message: 'rating must be 1–5' })

    
    const [u2] = await pool.query('SELECT user_id FROM users WHERE user_id=?', [userId])
    if (!u2.length) return res.status(404).json({ message: 'User not found. Please register or login.' })

     
    const [d] = await pool.query('SELECT destination_id FROM destinations WHERE destination_id=?', [destinationId])
    if (!d.length) return res.status(404).json({ message: 'Destination not found' })

    
    const [ret] = await pool.query(
      `INSERT INTO reviews (user_id, destination_id, rating, review_text, created_at)
       VALUES (?, ?, ?, ?, COALESCE(?, NOW()))`,
      [userId, destinationId, n, comment, date || null]
    )

    const [rows] = await pool.query(
      `SELECT r.review_id, r.user_id, r.destination_id, u.username,
              d.name AS destination_name, r.rating, r.review_text, r.created_at
       FROM reviews r
       JOIN users u ON u.user_id = r.user_id
       JOIN destinations d ON d.destination_id = r.destination_id
       WHERE r.review_id=?`,
      [ret.insertId]
    )
    const r = rows[0]
    res.status(201).json({
      id: r.review_id,
      userId: r.user_id,
      destinationId: r.destination_id,
      destinationName: r.destination_name,
      username: r.username,
      rating: r.rating,
      comment: r.review_text,
      date: r.created_at
    })
  } catch (err) { next(err) }
})

export default router
