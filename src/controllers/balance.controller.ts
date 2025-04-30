import { Request, Response } from 'express';
import User from '../models/user.model';

export const updateBalance = async (req: Request, res: Response) => {
  try {
    const { userId, amount, action } = req.body;

    if (!userId || !amount || !action) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        details: {
          userId: !userId ? 'User ID is required' : undefined,
          amount: !amount ? 'Amount is required' : undefined,
          action: !action ? 'Action is required' : undefined
        }
      });
    }

    // Validate action type
    if (!['deposit', 'withdraw'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action type',
        details: 'Action must be either "deposit" or "withdraw"'
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount',
        details: 'Amount must be greater than 0'
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user can withdraw
    if (action === 'withdraw' && user.allowWithdrawal === 'not_allowed') {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal is not allowed for this user'
      });
    }

    // Check if user has sufficient balance for withdrawal
    if (action === 'withdraw' && user.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance',
        details: `Current balance: ${user.balance}, Required: ${amount}`
      });
    }

    // Update balance based on action
    const newBalance = action === 'deposit' 
      ? user.balance + amount 
      : user.balance - amount;

    // Update user balance
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { balance: newBalance } },
      { new: true }
    ).select('-password -paymentPassword');

    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        message: 'Error updating user balance'
      });
    }

    res.status(200).json({
      success: true,
      message: `Balance ${action}ed successfully`,
      data: {
        userId: updatedUser._id,
        previousBalance: user.balance,
        newBalance: updatedUser.balance,
        amount,
        action
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error updating balance',
      error: error.message
    });
  }
}; 