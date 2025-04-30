import express from 'express';
import { updateBalance } from '../controllers/balance.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Update user balance
router.post('/balance', authenticate, updateBalance);

export default router; 