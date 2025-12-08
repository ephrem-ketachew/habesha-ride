import User from '../models/user.model.js';
import Car from '../models/car.model.js';
import AppError from '../utils/appError.util.js';
import { UpdateProfileInput } from '../validation/user.schema.js';
import { UserRole, UserStatus } from '../types/user.types.js';
import { GetUsersAdminQuery } from '../validation/admin.validation.js';
import { deleteCloudinaryResources } from '../utils/cloudinary.util.js';

const extractPublicIdFromUrl = (url: string): string | null => {
  if (!url || !url.includes('cloudinary.com')) return null;

  try {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return null;

    const pathAfterUpload = url.substring(uploadIndex + 8);

    const versionMatch = pathAfterUpload.match(/^v\d+\//);
    const pathWithoutVersion = versionMatch
      ? pathAfterUpload.substring(versionMatch[0].length)
      : pathAfterUpload;

    const publicId = pathWithoutVersion.replace(/\.[^/.]+$/, '');

    return publicId || null;
  } catch {
    return null;
  }
};

export const updateProfile = async (
  userId: string,
  payload: UpdateProfileInput & { profileImage?: string },
  oldProfileImageUrl?: string,
) => {
  const oldUser = await User.findById(userId);
  if (!oldUser) throw new AppError('User not found', 404);

  if (payload.phoneNumber && oldUser.phoneNumber !== payload.phoneNumber) {
    const existingUser = await User.findOne({
      phoneNumber: payload.phoneNumber,
      _id: { $ne: userId },
    });

    if (existingUser) {
      throw new AppError(
        'Phone number is already in use by another user.',
        400,
      );
    }
  }

  if (payload.profileImage && oldUser.profileImage) {
    const DEFAULT_PROFILE_IMAGE =
      'https://res.cloudinary.com/dxhkryxzk/image/upload/v1755980278/avatar2_bkwawy.png';

    if (
      oldUser.profileImage !== DEFAULT_PROFILE_IMAGE &&
      oldUser.profileImage.includes('cloudinary.com')
    ) {
      const oldPublicId = extractPublicIdFromUrl(oldUser.profileImage);
      if (oldPublicId) {
        deleteCloudinaryResources([oldPublicId]).catch((err) => {
          console.error('Failed to delete old profile image:', err);
        });
      }
    }
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: payload },
    { new: true, runValidators: true },
  ).catch((error: any) => {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      if (field === 'phoneNumber') {
        throw new AppError(
          'Phone number is already in use by another user.',
          400,
        );
      }
      if (field === 'email') {
        throw new AppError('Email is already in use by another user.', 400);
      }
      throw new AppError(`${field} must be unique.`, 400);
    }
    throw error;
  });

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

export const getUserByIdAdmin = async (
  userId: string,
  options: {
    includeCars?: boolean;
    carsPage?: number;
    carsLimit?: number;
  } = {},
) => {
  const { includeCars = true, carsPage = 1, carsLimit = 10 } = options;

  const user = await User.findById(userId)
    .setOptions({ includeInactive: true })
    .select('+active +status');

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const result: any = { user };

  if (includeCars) {
    const skip = (carsPage - 1) * carsLimit;

    const [cars, totalCars] = await Promise.all([
      Car.find({ owner: userId })
        .populate('make', 'name')
        .populate('vehicleModel', 'name')
        .populate('rentalListing', 'status ratePerDay')
        .populate('saleListing', 'status salePrice')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(carsLimit),
      Car.countDocuments({ owner: userId }),
    ]);

    result.cars = cars;
    result.carsMetadata = {
      total: totalCars,
      page: carsPage,
      limit: carsLimit,
      totalPages: Math.ceil(totalCars / carsLimit),
    };
  }

  return result;
};
