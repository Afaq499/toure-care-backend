import { Router } from 'express';
import { createAgent, getAgent, updateAgent, getAllAgents } from '../controllers/agent.controller';
import { auth } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/agents', auth, createAgent);

// Protected routes
router.get('/agents', auth, getAllAgents);
router.get('/agents/:id', auth, getAgent);
router.put('/agents/:id', auth, updateAgent);

export default router; 