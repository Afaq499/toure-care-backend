import express from 'express';
import { createMember, getMemberDetails, getAgentMembers, getAllMembers } from '../controllers/member.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Create a new member (associated with an agent)
router.post('/', authenticate, createMember);

// Get all members with pagination and search
router.get('/', authenticate, getAllMembers);

// Get member details
router.get('/:id', authenticate, getMemberDetails);

// Get all members of an agent with pagination and search
router.get('/agent/:agentId', authenticate, getAgentMembers);

export default router; 