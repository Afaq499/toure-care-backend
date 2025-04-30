import express from 'express';
import { createMember, getMemberDetails, getAgentMembers, getAllMembers, updateMember, registerMember } from '../controllers/member.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Register a new member with referral code
router.post('/register', registerMember);

// Create a new member (associated with an agent)
router.post('/', authenticate, createMember);

// Get all members with pagination and search
router.get('/', authenticate, getAllMembers);

router.get('/member-detail', authenticate, getMemberDetails);

// Get member details
router.get('/:id', authenticate, getMemberDetails);

// Update member details
router.put('/:id', authenticate, updateMember);

// Get all members of an agent with pagination and search
router.get('/agent/:agentId', authenticate, getAgentMembers);

export default router; 