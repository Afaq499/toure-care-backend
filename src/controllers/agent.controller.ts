import { Request, Response } from 'express';
import User from '../models/user.model';
import { generateInvitationCode, generateParentId } from '../utils/helpers';
import bcrypt from 'bcryptjs';

// Create a new agent
export const createAgent = async (req: Request, res: Response) => {
  try {
    const {
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

    // Validate required fields
    if (!username || !password || !mobileNumber) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          username: !username ? 'Username is required' : undefined,
          password: !password ? 'Password is required' : undefined,
          mobileNumber: !mobileNumber ? 'Mobile number is required' : undefined
        }
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ name: username });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Username already registered',
        details: 'Please choose a different username'
      });
    }

    // Check if mobile number already exists
    const existingMobile = await User.findOne({ mobileNumber });
    if (existingMobile) {
      return res.status(400).json({ 
        error: 'Mobile number already registered',
        details: 'This mobile number is already in use'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPaymentPassword = paymentPassword ? await bcrypt.hash(paymentPassword, 10) : undefined;

    const invitationCode = await generateInvitationCode();
    const generatedParentId = await generateParentId();

    const user = new User({   
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
  } catch (error: any) {
    console.error('Error creating agent:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        error: 'Duplicate field error',
        details: `This ${field} is already in use`
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({ 
        error: 'Validation error',
        details: errors
      });
    }

    res.status(500).json({ 
      error: 'Internal server error',
      details: 'An unexpected error occurred while creating the agent'
    });
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

// Get all agents with pagination
export const getAllAgents = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get total count of agents
    const totalAgents = await User.countDocuments({ role: 'agent' });

    // Get paginated agents
    const agents = await User.find({ role: 'agent' })
      .skip(skip)
      .limit(limit)
      .select('-password -paymentPassword') // Exclude sensitive fields
      .sort({ createdAt: -1 });

    res.json({
      agents: agents.map(agent => ({
        id: agent._id,
        email: agent.email,
        name: agent.name,
        role: agent.role,
        parentId: agent.parentId,
        mobileNumber: agent.mobileNumber,
        balance: agent.balance,
        dailyAvailableOrders: agent.dailyAvailableOrders,
        todaysOrders: agent.todaysOrders,
        todaysCommission: agent.todaysCommission,
        reputation: agent.reputation,
        parentUser: agent.parentUser,
        invitationCode: agent.invitationCode,
        status: agent.status,
        frozenAmount: agent.frozenAmount,
        allowWithdrawal: agent.allowWithdrawal,
        withdrawalMinAmount: agent.withdrawalMinAmount,
        withdrawalMaxAmount: agent.withdrawalMaxAmount,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt
      })),
      pagination: {
        total: totalAgents,
        page,
        limit,
        totalPages: Math.ceil(totalAgents / limit)
      }
    });
  } catch (error) {
    console.error('Error getting agents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 