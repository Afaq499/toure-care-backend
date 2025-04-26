import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import { generateInvitationCode } from '../utils/helpers';

interface AuthRequest extends Request {
  user?: {
    _id: string;
  };
}

export const register = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      name,
      role = 'user',
      parentId,
      mobileNumber,
      parentUser = 'system'
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate invitation code if role is agent
    let invitationCode;
    if (role === 'agent') {
      invitationCode = await generateInvitationCode();
    }

    // Create new user
    const user = new User({
      email,
      password: hashedPassword,
      name,
      role,
      parentId,
      mobileNumber,
      parentUser,
      invitationCode
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        parentId: user.parentId,
        mobileNumber: user.mobileNumber,
        balance: user.balance,
        dailyAvailableOrders: user.dailyAvailableOrders,
        todaysOrders: user.todaysOrders,
        todaysCommission: user.todaysCommission,
        reputation: user.reputation,
        parentUser: user.parentUser,
        invitationCode: user.invitationCode,
        status: user.status,
        frozenAmount: user.frozenAmount,
        allowWithdrawal: user.allowWithdrawal
      },
      token,
    });
  } catch (error) {
    console.error('Error in registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { password, username } = req.body;
    // Find user
    const userSelector = (username?.includes('@')) ? { email: username } : {
      $or: [
        { name: username },
        { mobileNumber: username },
      ]
    }
    
    const user = await User.findOne(userSelector);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error logging in' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching profile' });
  }
}; 