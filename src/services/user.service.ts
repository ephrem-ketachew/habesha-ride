import User from '../models/user.model.js';
import AppError from '../utils/appError.util.js';
import { UpdateProfileInput } from '../validation/user.schema.js';
import { UserRole, UserStatus } from '../types/user.types.js';
import { GetUsersAdminQuery } from '../validation/admin.validation.js';

export const updatePrfile = async (
  userId: string,
  payload: UpdateProfileInput,
) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: payload },
    { new: true, runValidators: true },
  );

  if (!user) throw new AppError('User not found', 404);
  return user;
};

export const updateUserRole = async (
  targetUserId: string,
  newRole: UserRole,
  currentUserId: string,
) => {
  if (targetUserId === currentUserId) {
    throw new AppError('You cannot change your own role.', 400);
  }

  const user = await User.findById(targetUserId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  user.role = newRole;
  await user.save();

  return user;
};

export const getAllUsersAdmin = async (query: GetUsersAdminQuery) => {
  const { search, role, status, page, limit } = query;

  const filter: any = {};

  if (role) filter.role = role;
  if (status) filter.status = status;

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    filter.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { phoneNumber: searchRegex },
    ];
  }

  const skip = (page - 1) * limit;

  const users = await User.find(filter)
    .setOptions({ includeInactive: true })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('+status +active');

  const totalUsers = await User.countDocuments(filter).setOptions({
    includeInactive: true,
  });

  return {
    users,
    totalPages: Math.ceil(totalUsers / limit),
    currentPage: page,
    totalUsers,
  };
};

export const updateUserStatus = async (userId: string, status: UserStatus) => {
  const user = await User.findById(userId).setOptions({
    includeInactive: true,
  });

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (user.role === 'superadmin' && status === 'blocked') {
    throw new AppError('You cannot block a Superadmin.', 403);
  }

  user.status = status;
  await user.save();

  return user;
};
