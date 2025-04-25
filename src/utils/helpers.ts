import User from '../models/user.model';

export const generateInvitationCode = async (): Promise<string> => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  let isUnique = false;

  while (!isUnique) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if code already exists
    const existingUser = await User.findOne({ invitationCode: code });
    if (!existingUser) {
      isUnique = true;
    }
  }

  return code;
};

export const generateParentId = async (): Promise<string> => {
  const characters = '0123456789';
  let parentId = '';
  let isUnique = false;

  while (!isUnique) {
    parentId = '';
    for (let i = 0; i < 6; i++) {
      parentId += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if parentId exists and is an agent
    const existingAgent = await User.findOne({ parentId, role: 'agent' });
    if (!existingAgent) {
      isUnique = true;
    }
  }

  return parentId;
};

export const generateRandomString = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}; 