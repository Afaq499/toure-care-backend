import { Request, Response } from 'express';
import Account from '../models/account.model';
import { IAccount } from '../models/account.model';
import { IUser } from '../models/user.model';

// Extend Request type to include user
interface AuthRequest extends Request {
  user?: IUser;
}

function isUserIdDuplicateKeyError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }
  if ((error as { code?: number }).code !== 11000) {
    return false;
  }
  const keyPattern = (error as { keyPattern?: Record<string, unknown> }).keyPattern;
  return !keyPattern || Object.prototype.hasOwnProperty.call(keyPattern, 'userId');
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

    const accountUserId = String(userId);
    const accountFields = {
      fullName,
      cryptoAddress,
      network,
      phoneNumber
    };

    // An existing account is updated in place. This does not insert a second document.
    const existingAccount = await Account.findOneAndUpdate(
      { userId: accountUserId },
      { $set: accountFields },
      { new: true }
    );

    if (existingAccount) {
      return res.status(200).json({
        success: true,
        message: 'Account updated successfully',
        data: existingAccount
      });
    }

    try {
      // Insert only when this user still has no account. $setOnInsert does not
      // rewrite a document that another request created first.
      const result = await Account.findOneAndUpdate(
        { userId: accountUserId },
        { $setOnInsert: { userId: accountUserId, ...accountFields } },
        { upsert: true, new: true, setDefaultsOnInsert: true, includeResultMetadata: true }
      );

      const created = !result.lastErrorObject?.updatedExisting;
      return res.status(created ? 201 : 200).json({
        success: true,
        message: created ? 'Account created successfully' : 'Account updated successfully',
        data: result.value
      });
    } catch (error) {
      if (!isUserIdDuplicateKeyError(error)) {
        throw error;
      }

      console.error(
        'Concurrent account creation hit the userId unique index; reusing the existing account',
        { userId: accountUserId }
      );

      const account = await Account.findOne({ userId: accountUserId });
      if (!account) {
        throw error;
      }

      return res.status(200).json({
        success: true,
        message: 'Account updated successfully',
        data: account
      });
    }

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