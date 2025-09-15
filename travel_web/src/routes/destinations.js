import express from 'express'
import pool from '../db.js'

const router = express.Router()

const mapRow = (r) => ({
  id: r.destination_id,
  name: r.name,
  location: r.location,
  description: r.description,
  image: r.image_url,
  created_at: r.created_at
})

// GET all destinations
router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim()
    
    if (q) {
      const like = `%${q}%`
      const [rows] = await pool.query(
        `SELECT * FROM destinations
         WHERE name LIKE ? OR location LIKE ? OR description LIKE ?
         ORDER BY destination_id DESC`,
        [like, like, like]
      )
      return res.json(rows.map(mapRow))
    }
    
    const [rows] = await pool.query(`SELECT * FROM destinations ORDER BY destination_id DESC`)
    res.json(rows.map(mapRow))
  } catch (err) { 
    console.error('Error fetching destinations:', err)
    next(err) 
  }
})

// CREATE new destination
router.post('/', async (req, res, next) => {
  try {
    const { name, location, description, image } = req.body
    
    if (!name || !location) {
      return res.status(400).json({ 
        error: 'Name and location are required',
        message: 'name and location are required' 
      })
    }

    const [result] = await pool.query(
      `INSERT INTO destinations (name, location, description, image_url)
       VALUES (?, ?, ?, ?)`,
      [name, location, description || null, image || null]
    )
    
    const [rows] = await pool.query('SELECT * FROM destinations WHERE destination_id = ?', [result.insertId])
    
    if (rows.length === 0) {
      return res.status(500).json({ error: 'Failed to retrieve created destination' })
    }
    
    res.status(201).json(mapRow(rows[0]))
  } catch (err) { 
    console.error('Error creating destination:', err)
    next(err) 
  }
})

// UPDATE destination
router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const { name, location, description, image } = req.body
    
    // Check if destination exists
    const [exists] = await pool.query('SELECT destination_id FROM destinations WHERE destination_id = ?', [id])
    if (exists.length === 0) {
      return res.status(404).json({ 
        error: 'Destination not found',
        message: 'Destination not found' 
      })
    }

    // Update destination
    await pool.query(
      `UPDATE destinations 
       SET name = ?, location = ?, description = ?, image_url = ? 
       WHERE destination_id = ?`,
      [name, location, description || null, image || null, id]
    )
    
    // Get updated destination
    const [rows] = await pool.query('SELECT * FROM destinations WHERE destination_id = ?', [id])
    
    if (rows.length === 0) {
      return res.status(500).json({ error: 'Failed to retrieve updated destination' })
    }
    
    res.json(mapRow(rows[0]))
  } catch (err) { 
    console.error('Error updating destination:', err)
    next(err) 
  }
})

// DELETE destination
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    
    // Check if destination exists
    const [exists] = await pool.query('SELECT destination_id FROM destinations WHERE destination_id = ?', [id])
    if (exists.length === 0) {
      return res.status(404).json({ 
        error: 'Destination not found',
        message: 'Destination not found' 
      })
    }

    // Delete destination
    await pool.query('DELETE FROM destinations WHERE destination_id = ?', [id])
    
    res.json({ 
      success: true,
      message: 'Destination deleted successfully',
      deletedId: id 
    })
  } catch (err) { 
    console.error('Error deleting destination:', err)
    next(err) 
  }
})

export default router