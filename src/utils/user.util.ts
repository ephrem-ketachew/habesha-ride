import { IUserDocument, PublicUserProfile } from '../types/user.types.js';

export const sanitizeUserForResponse = (
  user: IUserDocument,
): PublicUserProfile => {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    status: user.status,
    profileImage: user.profileImage,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    createdAt: user.createdAt,
  };
};
