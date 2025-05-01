import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/user.model';
import MemberAssociation from '../models/member-association.model';
import Task from '../models/task.model';
import { generateRandomString } from '../utils/helpers';
import bcrypt from 'bcryptjs';
import Account from '../models/account.model';

interface AuthRequest extends Request {
  user?: {
    _id: string;
    name: string;
    mobileNumber: string;
  };
}

export const createMember = async (req: Request, res: Response) => {
  try {
    const {
     username,
      email,
      password,
      mobileNumber,
      parentId,
      commissionRate = 0,
      balance = 0,
      dailyAvailableOrders = 0,
      reputation = 0,
      allowWithdrawal = 'allowed',
      withdrawalMinAmount = 0,
      withdrawalMaxAmount = 1000000
    } = req.body;

    const parentAgent = await User.findOne({ _id: parentId, role: 'agent' });
    if (!parentAgent) {
      return res.status(404).json({
        success: false,
        message: 'Parent agent not found',
      });
    }

    // Generate a unique invitation code
    const invitationCode = generateRandomString(8);

    // Create the member user
    const member = new User({
      name: username,
      email,
      password: await bcrypt.hash(password, 10),
      mobileNumber,
      role: 'user',
      parentId,
      parentUser: parentAgent.name,
      invitationCode,
      todaysOrders: 0,
      todaysCommission: 0,
      status: true,
      frozenAmount: 0,
      balance,
      dailyAvailableOrders,
      reputation,
      allowWithdrawal,
      withdrawalMinAmount,
      withdrawalMaxAmount
    });

    await member.save();

    // Create the member-agent association
    const association = new MemberAssociation({
      memberId: member._id,
      agentId: parentId,
      commissionRate,
      status: 'active',
      joinedAt: new Date(),
      lastActiveAt: new Date(),
    });

    await association.save();

    // Return the created member without sensitive information
    const memberResponse = {
      _id: member._id,
      name: member.name,
      email: member.email,
      mobileNumber: member.mobileNumber,
      role: member.role,
      parentId: member.parentId,
      parentUser: member.parentUser,
      invitationCode: member.invitationCode,
      balance: member.balance,
      dailyAvailableOrders: member.dailyAvailableOrders,
      todaysOrders: member.todaysOrders,
      todaysCommission: member.todaysCommission,
      reputation: member.reputation,
      status: member.status,
      frozenAmount: member.frozenAmount,
      allowWithdrawal: member.allowWithdrawal,
      withdrawalMinAmount: member.withdrawalMinAmount,
      withdrawalMaxAmount: member.withdrawalMaxAmount,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
      association: {
        status: association.status,
        commissionRate: association.commissionRate,
        joinedAt: association.joinedAt,
        lastActiveAt: association.lastActiveAt,
      },
    };

    return res.status(201).json({
      success: true,
      message: 'Member created successfully',
      data: memberResponse,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error creating member',
      error: error.message,
    });
  }
};

export const getMemberDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const member = await User.findById(id || req.user?._id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    // Get the member's association details
    const association = await MemberAssociation.findOne({ memberId: id });

    // Get task statistics
    const [totalTasks, completedTasks, pendingTasks] = await Promise.all([
      Task.countDocuments({ userId: id || req.user?._id }),
      Task.countDocuments({ userId: id || req.user?._id, status: 'completed' }),
      Task.countDocuments({ userId: id || req.user?._id, status: 'pending' })
    ]);

    // Get account details
    const account = await Account.findOne({ userId: id || req.user?._id });

    // Return member details without sensitive information
    const memberResponse = {
      _id: member._id,
      name: member.name,
      email: member.email,
      mobileNumber: member.mobileNumber,
      role: member.role,
      parentId: member.parentId,
      parentUser: member.parentUser,
      invitationCode: member.invitationCode,
      balance: member.balance,
      dailyAvailableOrders: member.dailyAvailableOrders,
      todaysOrders: member.todaysOrders,
      todaysCommission: member.todaysCommission,
      reputation: member.reputation,
      todaysEarnings: member.todaysEarnings,
      totalEarnings: member.totalEarnings,
      status: member.status,
      frozenAmount: member.frozenAmount,
      allowWithdrawal: member.allowWithdrawal,
      withdrawalMinAmount: member.withdrawalMinAmount,
      withdrawalMaxAmount: member.withdrawalMaxAmount,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
      taskStats: {
        totalTasks,
        completedTasks,
        pendingTasks
      },
      association: association ? {
        status: association.status,
        commissionRate: association.commissionRate,
        joinedAt: association.joinedAt,
        lastActiveAt: association.lastActiveAt,
        totalCommissionEarned: association.totalCommissionEarned,
        totalOrders: association.totalOrders,
      } : null,
      account: account ? {
        fullName: account.fullName,
        cryptoAddress: account.cryptoAddress,
        network: account.network,
        phoneNumber: account.phoneNumber
      } : null
    };

    return res.status(200).json({
      success: true,
      data: memberResponse,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching member details',
      error: error.message,
    });
  }
};

export const getAgentMembers = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const { page = 1, limit = 10, search = '' } = req.query;

    // Check if the agent exists
    const agent = await User.findOne({ _id: agentId, role: 'agent' });
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Build search query
    const searchQuery = {
      parentId: agentId,
      role: 'user',
      ...(search && {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { mobileNumber: { $regex: search, $options: 'i' } },
        ],
      }),
    };

    // Get total count of members with search
    const total = await User.countDocuments(searchQuery);

    // Get paginated members with their associations
    const members = await User.find(searchQuery)
      .select('-password')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    // Get associations for all members
    const memberIds = members.map(member => member._id);
    const associations = await MemberAssociation.find({ memberId: { $in: memberIds } });

    // Map associations to members
    const membersWithAssociations = members.map(member => {
      const association = associations.find(a => a.memberId.toString() === member._id.toString());
      return {
        ...member.toObject(),
        association: association ? {
          status: association.status,
          commissionRate: association.commissionRate,
          joinedAt: association.joinedAt,
          lastActiveAt: association.lastActiveAt,
          totalCommissionEarned: association.totalCommissionEarned,
          totalOrders: association.totalOrders,
        } : null,
      };
    });

    return res.status(200).json({
      success: true,
      data: membersWithAssociations,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching agent members',
      error: error.message,
    });
  }
};

export const getAllMembers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build search query
    const searchQuery = {
      role: 'user',
      ...(search && {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { mobileNumber: { $regex: search, $options: 'i' } },
        ],
      }),
    };

    // Get total count of members with search
    const total = await User.countDocuments(searchQuery);

    // Get paginated members with their associations
    const members = await User.find(searchQuery)
      .select('-password')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    // Get associations for all members
    const memberIds = members.map(member => member._id);
    const associations = await MemberAssociation.find({ memberId: { $in: memberIds } });

    // Get parent agents for all members, filtering out invalid parentIds
    const validAgentIds = members
      .map(member => member.parentId)
      .filter(id => id && id !== '0' && mongoose.Types.ObjectId.isValid(id));
    
    const agents = validAgentIds.length > 0 
      ? await User.find({ _id: { $in: validAgentIds } })
      : [];

    // Map associations and agent details to members
    const membersWithDetails = members.map(member => {
      const association = associations.find(a => a.memberId.toString() === member._id.toString());
      const agent = member.parentId && member.parentId !== '0' && mongoose.Types.ObjectId.isValid(member.parentId)
        ? agents.find(a => a._id.toString() === member.parentId)
        : null;
      
      return {
        ...member.toObject(),
        association: association ? {
          status: association.status,
          commissionRate: association.commissionRate,
          joinedAt: association.joinedAt,
          lastActiveAt: association.lastActiveAt,
          totalCommissionEarned: association.totalCommissionEarned,
          totalOrders: association.totalOrders,
        } : null,
        agent: agent ? {
          id: agent._id,
          name: agent.name,
          parentId: agent.parentId,
          mobileNumber: agent.mobileNumber,
        } : null,
      };
    });

    return res.status(200).json({
      success: true,
      data: membersWithDetails,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.log("error => ", error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching members',
      error: error.message,
    });
  }
};

export const updateMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      mobileNumber,
      status,
      balance,
      dailyAvailableOrders,
      reputation,
      frozenAmount,
      allowWithdrawal,
      withdrawalMinAmount,
      withdrawalMaxAmount,
      commissionRate,
    } = req.body;

    // Find the member
    const member = await User.findById(id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    // Update member details
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (mobileNumber) updateData.mobileNumber = mobileNumber;
    if (status !== undefined) updateData.status = status;
    if (balance !== undefined) updateData.balance = balance;
    if (dailyAvailableOrders !== undefined) updateData.dailyAvailableOrders = dailyAvailableOrders;
    if (reputation !== undefined) updateData.reputation = reputation;
    if (frozenAmount !== undefined) updateData.frozenAmount = frozenAmount;
    if (allowWithdrawal) updateData.allowWithdrawal = allowWithdrawal;
    if (withdrawalMinAmount !== undefined) updateData.withdrawalMinAmount = withdrawalMinAmount;
    if (withdrawalMaxAmount !== undefined) updateData.withdrawalMaxAmount = withdrawalMaxAmount;

    // Update member
    const updatedMember = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    // Update association if commission rate is provided
    if (commissionRate !== undefined) {
      await MemberAssociation.findOneAndUpdate(
        { memberId: id },
        { 
          $set: { 
            commissionRate,
            lastActiveAt: new Date()
          }
        },
        { new: true }
      );
    }

    // Get the updated association
    const association = await MemberAssociation.findOne({ memberId: id });

    // Get agent details
    const agent = member.parentId && member.parentId !== '0' && mongoose.Types.ObjectId.isValid(member.parentId)
      ? await User.findById(member.parentId).select('name email mobileNumber')
      : null;

    const response = {
      ...updatedMember?.toObject(),
      association: association ? {
        status: association.status,
        commissionRate: association.commissionRate,
        joinedAt: association.joinedAt,
        lastActiveAt: association.lastActiveAt,
        totalCommissionEarned: association.totalCommissionEarned,
        totalOrders: association.totalOrders,
      } : null,
      agent: agent ? {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        mobileNumber: agent.mobileNumber,
      } : null,
    };

    return res.status(200).json({
      success: true,
      message: 'Member updated successfully',
      data: response,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error updating member',
      error: error.message,
    });
  }
};

export const registerMember = async (req: Request, res: Response) => {
  try {
    const {
      loginPassword,
      phoneNumber,
      referralCode,
      username,
      withdrawPassword
    } = req.body;

    // Find agent by referral code
    const agent = await User.findOne({ invitationCode: referralCode, role: 'agent' });
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Invalid referral code or agent not found',
      });
    }

    // Generate a unique invitation code for the new member
    const memberInvitationCode = generateRandomString(8);

    // Create the member user
    const member = new User({
      name: username,
      mobileNumber: phoneNumber,
      password: await bcrypt.hash(loginPassword, 10),
      role: 'user',
      parentId: agent._id,
      parentUser: agent.name,
      invitationCode: memberInvitationCode,
      todaysOrders: 0,
      todaysCommission: 0,
      status: true,
      frozenAmount: 0,
      balance: 0,
      dailyAvailableOrders: 0,
      reputation: 100,
      allowWithdrawal: 'allowed',
      withdrawalMinAmount: 0,
      withdrawalMaxAmount: 1000000
    });

    await member.save();

    // Create the member-agent association
    const association = new MemberAssociation({
      memberId: member._id,
      agentId: agent._id,
      commissionRate: 0,
      status: 'active',
      joinedAt: new Date(),
      lastActiveAt: new Date(),
    });

    await association.save();

    // Return the created member without sensitive information
    const memberResponse = {
      _id: member._id,
      name: member.name,
      mobileNumber: member.mobileNumber,
      role: member.role,
      parentId: member.parentId,
      parentUser: member.parentUser,
      invitationCode: member.invitationCode,
      balance: member.balance,
      dailyAvailableOrders: member.dailyAvailableOrders,
      todaysOrders: member.todaysOrders,
      todaysCommission: member.todaysCommission,
      reputation: member.reputation,
      status: member.status,
      frozenAmount: member.frozenAmount,
      allowWithdrawal: member.allowWithdrawal,
      withdrawalMinAmount: member.withdrawalMinAmount,
      withdrawalMaxAmount: member.withdrawalMaxAmount,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
      association: {
        status: association.status,
        commissionRate: association.commissionRate,
        joinedAt: association.joinedAt,
        lastActiveAt: association.lastActiveAt,
      },
    };

    return res.status(201).json({
      success: true,
      message: 'Member registered successfully',
      data: memberResponse,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error registering member',
      error: error.message,
    });
  }
}; 