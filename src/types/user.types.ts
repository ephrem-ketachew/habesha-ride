import { Document } from 'mongoose';

export type UserRole = 'user' | 'admin' | 'superadmin';
export type UserStatus = 'pending' | 'approved' | 'blocked';

export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  active: boolean;
  profileImage?: string;

  isEmailVerified: boolean;
  isPhoneVerified: boolean;

  createdAt: Date;
  updatedAt: Date;

  passwordChangedAt?: Date;

  emailVerificationToken?: string;
  emailVerificationTokenExpires?: Date;

  phoneOtp?: string;
  phoneOtpExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  googleId?: string;

  // Identity Verification Fields
  faydaId?: string;
  isIdentityVerified: boolean;
  identityVerifiedAt?: Date;
  identityVerificationMethod?: 'fayda' | 'passport' | null;

  faydaData?: {
    sub?: string;
    name?: string;
    nameEn?: string;
    nameAm?: string;
    birthdate?: string;
    picture?: string;
    gender?: string;
    address?: string;
    phone_number?: string;
    email?: string;
    verifiedAt?: Date;
  };
}

export interface PublicUserProfile {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  status: string;
  profileImage?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: Date;
}
export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  hasPasswordChangedAfter(JWTTimestamp: number): boolean;

  createEmailVerificationToken(): string;
  createPhoneOtp(): string;
  createPasswordResetToken(): string;
  fullName: string;
}
