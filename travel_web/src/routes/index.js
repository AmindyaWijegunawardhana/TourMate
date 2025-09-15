import express from 'express'
import authRoutes from './auth.js'  
import adminAuthRoutes from './adminAuth.js'   
import destinationRoutes from './destinations.js'   
import reviewRoutes from './reviews.js'   

const router = express.Router()


router.use('/api', authRoutes)         
router.use('/api', adminAuthRoutes)    
router.use('/api/destinations', destinationRoutes)  
router.use('/api/reviews', reviewRoutes)  

export default router
