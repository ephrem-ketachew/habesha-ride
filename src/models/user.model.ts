/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *       properties:
 *         _id:
 *           type: string
 *           description: User ID
 *           example: 507f1f77bcf86cd799439011
 *         firstName:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           description: User's first name
 *           example: John
 *         lastName:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           description: User's last name
 *           example: Doe
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: john.doe@example.com
 *         phoneNumber:
 *           type: string
 *           description: User's phone number
 *           example: "+251911234567"
 *         role:
 *           type: string
 *           enum: [user, admin, superadmin]
 *           default: user
 *           description: User role
 *         status:
 *           type: string
 *           enum: [pending, approved, blocked]
 *           default: pending
 *           description: User account status
 *         profileImage:
 *           type: string
 *           description: URL to user's profile image
 *           example: https://res.cloudinary.com/dxhkryxzk/image/upload/v1755980278/avatar2_bkwawy.png
 *         isEmailVerified:
 *           type: boolean
 *           default: false
 *           description: Email verification status
 *         isPhoneVerified:
 *           type: boolean
 *           default: false
 *           description: Phone verification status
 *         googleId:
 *           type: string
 *           description: Google OAuth ID
 *         faydaId:
 *           type: string
 *           description: Fayda (eSignet) subject identifier (unique national ID)
 *           example: fayda_sub_identifier_12345
 *         isIdentityVerified:
 *           type: boolean
 *           default: false
 *           description: Identity verification status (via Fayda or passport)
 *         identityVerifiedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Timestamp when identity was verified
 *           example: "2025-12-11T10:30:00.000Z"
 *         identityVerificationMethod:
 *           type: string
 *           enum: [fayda, passport, null]
 *           nullable: true
 *           default: null
 *           description: Method used for identity verification
 *         faydaData:
 *           $ref: '#/components/schemas/FaydaData'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     FaydaData:
 *       type: object
 *       description: User data retrieved from Fayda (eSignet) identity verification
 *       properties:
 *         sub:
 *           type: string
 *           nullable: true
 *           description: Fayda subject identifier (unique)
 *           example: fayda_sub_identifier_12345
 *         name:
 *           type: string
 *           description: Full name (single language or default)
 *           example: John Doe
 *         nameEn:
 *           type: string
 *           description: English name (if multi-language claims requested)
 *           example: John Doe
 *         nameAm:
 *           type: string
 *           description: Amharic name (if multi-language claims requested)
 *           example: ጆን ዶይ
 *         birthdate:
 *           type: string
 *           format: date
 *           description: Date of birth (YYYY-MM-DD)
 *           example: "1990-01-01"
 *         picture:
 *           type: string
 *           format: uri
 *           description: Profile photo URL from Fayda
 *           example: https://fayda.gov.et/profile/photo.jpg
 *         gender:
 *           type: string
 *           description: Gender
 *           example: male
 *         address:
 *           type: string
 *           description: Address
 *           example: Addis Ababa, Ethiopia
 *         phone_number:
 *           type: string
 *           description: Phone number from Fayda
 *           example: "+251911234567"
 *         email:
 *           type: string
 *           format: email
 *           description: Email from Fayda (if available)
 *           example: john.doe@example.com
 *         verifiedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Timestamp when data was verified from Fayda
 *           example: "2025-12-11T10:30:00.000Z"
 *     UserVerificationData:
 *       type: object
 *       description: User identity verification data returned by verification endpoints
 *       properties:
 *         id:
 *           type: string
 *           description: User ID
 *           example: 507f1f77bcf86cd799439011
 *         isIdentityVerified:
 *           type: boolean
 *           description: Identity verification status
 *         identityVerificationMethod:
 *           type: string
 *           enum: [fayda, passport, null]
 *           nullable: true
 *           description: Method used for identity verification
 *         identityVerifiedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Timestamp when identity was verified
 *         faydaId:
 *           type: string
 *           nullable: true
 *           description: Fayda subject identifier
 *         faydaData:
 *           $ref: '#/components/schemas/FaydaData'
 *     VerificationStatus:
 *       type: object
 *       description: Current identity verification status for a user
 *       properties:
 *         isIdentityVerified:
 *           type: boolean
 *           description: Whether the user's identity is verified
 *         identityVerificationMethod:
 *           type: string
 *           enum: [fayda, passport, null]
 *           nullable: true
 *           description: Method used for identity verification
 *         identityVerifiedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Timestamp when identity was verified
 *         faydaId:
 *           type: string
 *           nullable: true
 *           description: Fayda subject identifier (if verified via Fayda)
 *         faydaData:
 *           $ref: '#/components/schemas/FaydaData'
 *           nullable: true
 *           description: Fayda user data (if verified via Fayda)
 */
import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import validator from 'validator';
import mongooseSanitize from 'mongoose-sanitize';
import { IUserDocument, UserRole, UserStatus } from '../types/user.types.js';

const DEFAULT_PROFILE_IMAGE =
  'https://res.cloudinary.com/dxhkryxzk/image/upload/v1755980278/avatar2_bkwawy.png';

const userSchema = new Schema<IUserDocument>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required.'],
      set: (val: string) => val.trim(),
      minlength: [2, 'First name must be at least 2 characters.'],
      maxlength: [50, 'First name cannot exceed 50 characters.'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required.'],
      set: (val: string) => val.trim(),
      minlength: [2, 'Last name must be at least 2 characters.'],
      maxlength: [50, 'Last name cannot exceed 50 characters.'],
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      set: (val: string) => val.toLowerCase().trim(),
      validate: [validator.isEmail, 'Please provide a valid email address.'],
    },
    phoneNumber: {
      type: String,
      required: [
        function (this: IUserDocument) {
          return !this.googleId;
        },
        'Phone number is required for email/password sign-ups.',
      ],
      trim: true,
    },
    password: {
      type: String,
      required: [
        function (this: IUserDocument) {
          return !this.googleId;
        },
        'Password is required for email/password sign-ups.',
      ],
      validate: {
        validator: function (value: string) {
          if (!value) return true;
          return validator.isStrongPassword(value, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
          });
        },
        message:
          'Password must be at least 8 chars, with 1 uppercase, 1 lowercase, 1 number, and 1 symbol.',
      },
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin', 'superadmin'] as UserRole[],
        message: 'Role is either: user, admin, or superadmin',
      },
      default: 'user',
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'blocked'] as UserStatus[],
        message: 'Status is either: pending, approved, or blocked',
      },
      default: 'pending',
    },
    profileImage: {
      type: String,
      required: false,
      default: DEFAULT_PROFILE_IMAGE,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    googleId: {
      type: String,
    },

    passwordChangedAt: {
      type: Date,
      select: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationTokenExpires: {
      type: Date,
      select: false,
    },
    phoneOtp: {
      type: String,
      select: false,
    },
    phoneOtpExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },

    faydaId: {
      type: String,
      sparse: true,
    },
    isIdentityVerified: {
      type: Boolean,
      default: false,
    },
    identityVerifiedAt: {
      type: Date,
    },
    identityVerificationMethod: {
      type: String,
      enum: {
        values: ['fayda', 'passport', null],
        message:
          'Identity verification method is either: fayda, passport, or null',
      },
      default: null,
    },

    faydaData: {
      sub: {
        type: String,
      },
      name: {
        type: String,
      },
      nameEn: {
        type: String,
      },
      nameAm: {
        type: String,
      },
      birthdate: {
        type: String,
      },
      picture: {
        type: String,
      },
      gender: {
        type: String,
      },
      address: {
        type: String,
      },
      phone_number: {
        type: String,
      },
      email: {
        type: String,
      },
      verifiedAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.plugin(mongooseSanitize);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phoneNumber: 1 }, { unique: true, sparse: true });
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });
userSchema.index({ firstName: 1, lastName: 1 });

userSchema.index({ role: 1, status: 1 });

userSchema.index({ faydaId: 1 }, { unique: true, sparse: true });
userSchema.index({ isIdentityVerified: 1 });
userSchema.index({ identityVerifiedAt: 1 });

userSchema.index({
  firstName: 'text',
  lastName: 'text',
  email: 'text',
});

userSchema.virtual('fullName').get(function (this: IUserDocument) {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  if (!this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }
  next();
});

userSchema.pre(/^find/, function (this: any, next) {
  if (this.getOptions().includeInactive === true) {
    return next();
  }
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  const user = await User.findById(this._id).select('+password');
  if (!user || !user.password) return false;
  return await bcrypt.compare(candidatePassword, user.password);
};

userSchema.methods.hasPasswordChangedAfter = function (
  JWTTimestamp: number,
): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = this.passwordChangedAt.getTime() / 1000;
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createEmailVerificationToken = function (): string {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  this.emailVerificationTokenExpires = new Date(
    Date.now() + 24 * 60 * 60 * 1000,
  );
  return verificationToken;
};

userSchema.methods.createPhoneOtp = function (): string {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.phoneOtp = crypto.createHash('sha256').update(otp).digest('hex');
  this.phoneOtpExpires = new Date(Date.now() + 5 * 60 * 1000);
  return otp;
};

userSchema.methods.createPasswordResetToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
  return resetToken;
};

const User = mongoose.model<IUserDocument>('User', userSchema);

export default User;
