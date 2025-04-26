import { Request, Response } from 'express';
import Task from '../models/task.model';
import User from '../models/user.model';
import Product from '../models/product.model';

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

export const resetTasks = async (req: Request, res: Response) => {
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

export const getTaskStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const tasks = await Task.find({ userId })
      .populate('productId')
      .select('status result productPrice');
    
    res.status(200).json(tasks);
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