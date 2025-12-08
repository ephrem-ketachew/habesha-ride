import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync.util.js';
import * as userService from '../services/user.service.js';
import { UpdateProfileInput } from '../validation/user.schema.js';
import AppError from '../utils/appError.util.js';

export const userProfile = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
});

export const updateProfileHandler = catchAsync(
  async (req: Request<{}, {}, UpdateProfileInput>, res: Response) => {
    const forbidden = [
      'password',
      'passwordConfirm',
      'role',
      'status',
      'emailVerificationToken',
      'emailVerificationTokenExpires',
      'phoneOtp',
      'phoneOtpExpires',
      'passwordResetToken',
      'passwordResetExpires',
    ];
    forbidden.forEach((f) => {
      if ((req.body as any)[f] !== undefined) delete (req.body as any)[f];
    });

    if (!req.user) {
      throw new AppError('User not found', 401);
    }

    const updatePayload: UpdateProfileInput & { profileImage?: string } = {
      ...req.body,
    };

    const oldProfileImageUrl = req.user.profileImage;

    if (req.file?.path) {
      updatePayload.profileImage = req.file.path;
    }

    const user = await userService.updateProfile(
      req.user.id,
      updatePayload,
      oldProfileImageUrl,
    );

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  },
);
