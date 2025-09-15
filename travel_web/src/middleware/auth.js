import jwt from 'jsonwebtoken'

export function userAuthRequired(req, res, next) {
  try {
    const hdr = req.headers['authorization'] || ''
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null
    if (!token) return res.status(401).json({ message: 'Missing token' })
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    if (payload.role !== 'user') return res.status(403).json({ message: 'User token required' })
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export function adminAuthRequired(req, res, next) {
  try {
    const hdr = req.headers['authorization'] || ''
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null
    if (!token) return res.status(401).json({ message: 'Missing token' })
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    if (payload.role !== 'admin') return res.status(403).json({ message: 'Admin token required' })
    req.admin = payload
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}
