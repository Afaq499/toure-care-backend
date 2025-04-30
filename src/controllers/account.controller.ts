import { Request, Response } from 'express';
import Account from '../models/account.model';
import { IAccount } from '../models/account.model';
import { IUser } from '../models/user.model';

// Extend Request type to include user
interface AuthRequest extends Request {
  user?: IUser;
}

export const createOrUpdateAccount = async (req: AuthRequest, res: Response) => {
  try {
    const { fullName, cryptoAddress, network, phoneNumber, user_id } = req.body;
    const userId = user_id || req.user?._id; // Assuming we have user info from auth middleware

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Validate required fields
    if (!fullName || !cryptoAddress || !network || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate network type
    if (!['TRC20', 'ERC20', 'BTC'].includes(network)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid network type'
      });
    }

    // Try to find existing account
    const existingAccount = await Account.findOne({ userId });

    if (existingAccount) {
      // Update existing account
      const updatedAccount = await Account.findOneAndUpdate(
        { userId },
        {
          fullName,
          cryptoAddress,
          network,
          phoneNumber
        },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Account updated successfully',
        data: updatedAccount
      });
    }

    // Create new account
    const newAccount = new Account({
      userId,
      fullName,
      cryptoAddress,
      network,
      phoneNumber
    });

    await newAccount.save();

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: newAccount
    });

  } catch (error) {
    console.error('Error in createOrUpdateAccount:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.query.user_id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const account = await Account.findOne({ userId });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: account
    });

  } catch (error) {
    console.error('Error in getAccount:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 