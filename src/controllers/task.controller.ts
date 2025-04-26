import { Request, Response } from 'express';
import Task from '../models/task.model';
import User from '../models/user.model';
import Product from '../models/product.model';

interface AuthRequest extends Request {
  user?: {
    _id: string;
    name: string;
    mobileNumber: string;
  };
}

export const assignRandomTasks = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Find user and get their daily available orders
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all available products
    const products = await Product.find();
    if (products.length === 0) {
      return res.status(404).json({ message: 'No products available' });
    }

    // Delete existing tasks for the user
    await Task.deleteMany({ userId });

    // Randomly select products based on dailyAvailableOrders
    const selectedProducts = [];
    const availableOrders = user.dailyAvailableOrders || 5; // Default to 5 if not set

    while (selectedProducts.length < availableOrders && products.length > 0) {
      const randomIndex = Math.floor(Math.random() * products.length);
      selectedProducts.push(products[randomIndex]);
      products.splice(randomIndex, 1);
    }

    // Create tasks for selected products
    const tasks = await Task.insertMany(
      selectedProducts.map(product => ({
        productId: product._id,
        userId,
        productPrice: product.price
      }))
    );

    res.status(201).json({ message: 'Tasks assigned successfully', tasks });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning tasks', error });
  }
};

export const resetTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Delete all tasks for the user
    await Task.deleteMany({ userId });
    
    // Reassign tasks
    return assignRandomTasks(req, res);
  } catch (error) {
    res.status(500).json({ message: 'Error resetting tasks', error });
  }
};

export const getTaskStatus = async (req: AuthRequest, res: Response) => {
  try {
    let userId: string = req.params.userId;
    if (!userId || userId === 'undefined') {
      if (!req.user?._id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      userId = req.user._id;
    }

    console.log("userId => ", userId);
    
    const tasks = await Task.find({ userId })
      .populate('productId')
      .select('status result productPrice');

      const [totalTasks, completedTasks, pendingTasks] = await Promise.all([
        Task.countDocuments({ userId }),
        Task.countDocuments({ userId, status: 'completed' }),
        Task.countDocuments({ userId, status: 'pending' })
      ]);
    
    res.status(200).json({
      totalTasks,
      completedTasks,
      pendingTasks,
      tasks
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task status', error });
  }
};

export const getTaskStats = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const [totalTasks, completedTasks, pendingTasks] = await Promise.all([
      Task.countDocuments({ userId }),
      Task.countDocuments({ userId, status: 'completed' }),
      Task.countDocuments({ userId, status: 'pending' })
    ]);
    
    res.status(200).json({
      totalTasks,
      completedTasks,
      pendingTasks
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task stats', error });
  }
};

export const submitTask = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { rating, review } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update task status and add review
    task.status = 'completed';
    task.rating = rating;
    task.review = review;
    task.completedAt = new Date();
    await task.save();

    // Calculate earnings (1% of product price)
    const earnings = task.productPrice * 0.01;

    // Update user's earnings
    const user = await User.findById(task.userId);
    if (user) {
      // Update total earnings
      user.totalEarnings = (user.totalEarnings || 0) + earnings;
      
      // Update today's earnings
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (!user.todaysEarnings || user.lastEarningDate < today) {
        user.todaysEarnings = earnings;
        user.lastEarningDate = today;
      } else {
        user.todaysEarnings += earnings;
      }

      await user.save();
    }

    res.status(200).json({
      message: 'Task submitted successfully',
      task,
      earnings
    });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting task', error });
  }
}; 