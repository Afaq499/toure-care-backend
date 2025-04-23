import { Request, Response } from 'express';
import User from '../models/user.model';
import { generateInvitationCode, generateParentId } from '../utils/helpers';
import bcrypt from 'bcryptjs';

// Create a new agent
export const createAgent = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      username,
      mobileNumber,
      parentUser = 'system',
      balance = 0,
      dailyAvailableOrders = 0,
      reputation = 0,
      allowWithdrawal = 'allowed',
      paymentPassword,
      withdrawalMinAmount = 0,
      withdrawalMaxAmount = 1000000
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPaymentPassword = paymentPassword ? await bcrypt.hash(paymentPassword, 10) : undefined;

    const invitationCode = await generateInvitationCode();

    const generatedParentId = await generateParentId();

    const user = new User({
      email,
      password: hashedPassword,
      name: username,
      role: 'agent',
      parentId: generatedParentId,
      mobileNumber,
      parentUser,
      invitationCode,
      balance,
      dailyAvailableOrders,
      reputation,
      allowWithdrawal,
      paymentPassword: hashedPaymentPassword,
      withdrawalMinAmount,
      withdrawalMaxAmount
    });

    await user.save();

    res.status(201).json({
      message: 'Agent created successfully',
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
        allowWithdrawal: user.allowWithdrawal,
        withdrawalMinAmount: user.withdrawalMinAmount,
        withdrawalMaxAmount: user.withdrawalMaxAmount
      }
    });
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get agent by ID
export const getAgent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id, role: 'agent' });

    if (!user) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({
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
      }
    });
  } catch (error) {
    console.error('Error getting agent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update agent
export const updateAgent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove any fields that shouldn't be updated
    delete updates._id;
    delete updates.email;
    delete updates.password;
    delete updates.role;
    delete updates.registrationTime;
    delete updates.invitationCode;

    const user = await User.findOneAndUpdate(
      { _id: id, role: 'agent' },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({
      message: 'Agent updated successfully',
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
      }
    });
  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 