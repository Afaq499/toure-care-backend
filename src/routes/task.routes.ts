import express from 'express';
import {
  assignRandomTasks,
  resetTasks,
  getTaskStatus,
  getTaskStats
} from '../controllers/task.controller';

const router = express.Router();

// Assign random tasks to a user
router.post('/assign/:userId', assignRandomTasks);

// Reset tasks for a user
router.post('/reset/:userId', resetTasks);

// Get task status with results
router.get('/status/:userId', getTaskStatus);

// Get task statistics
router.get('/stats/:userId', getTaskStats);

export default router; 