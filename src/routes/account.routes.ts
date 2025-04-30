import { Router } from 'express';
import { createOrUpdateAccount, getAccount } from '../controllers/account.controller';
import { auth } from '../middleware/auth.middleware';

const router = Router();

// Route to create or update account
router.post('/', auth, createOrUpdateAccount);

// Route to get account details
router.get('/', auth, getAccount);

export default router; 