import express from 'express';
import { getUsers } from '../controllers/usersController.js';

const router = express.Router();

// GET all users
router.get('/', getUsers);

export default router;
