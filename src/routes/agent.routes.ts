import { Router } from 'express';
import { createAgent, getAgent, updateAgent } from '../controllers/agent.controller';
import { auth } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/agents', createAgent);

// Protected routes
router.get('/agents/:id', auth, getAgent);
router.put('/agents/:id', auth, updateAgent);

export default router; 