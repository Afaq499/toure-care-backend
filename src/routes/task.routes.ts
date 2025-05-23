import express from 'express';
import { auth } from '../middleware/auth.middleware';
import {
  assignRandomTasks,
  resetTasks,
  getTaskStatus,
  getTaskStats,
  submitTask,
  updateTasksWithProduct
} from '../controllers/task.controller';

const router = express.Router();

// Assign random tasks to a user
router.post('/assign/:userId', auth, assignRandomTasks);

// Reset tasks for a user
router.post('/reset/:userId', auth, resetTasks);

// Get task status with results
router.get('/status/:userId', auth, getTaskStatus);

// Get task statistics
// router.get('/stats/:userId', auth, getTaskStats);

// Submit task with rating and review
router.post('/submit/:taskId', auth, submitTask);

// Update multiple tasks with a new product
router.post('/update-tasks', auth, updateTasksWithProduct);

export default router; 