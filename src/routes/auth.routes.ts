import { Router } from 'express';
import { register, login, getProfile } from '../controllers/auth.controller';
import { auth } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', auth, getProfile);

export default router; 