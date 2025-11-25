import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.util.js';
import * as authService from '../services/auth.service.js';
import {
  RegisterUserInput,
  VerifyEmailInput,
  LoginUserInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ResetPasswordTokenInput,
  UpdatePasswordInput,
  GoogleAuthInput,
} from '../validation/auth.schema.js';
import config from '../config/env.config.js';

const cookieOptions = {
  httpOnly: true,
  secure: config.isProduction ? true : false,
  sameSite: (config.isProduction ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 90 * 24 * 60 * 60 * 1000,
};

export const registerHandler = catchAsync(
  async (
    req: Request<{}, {}, RegisterUserInput>,
    res: Response,
    next: NextFunction,
  ) => {
    await authService.registerUser(req.body);

    res.status(201).json({
      status: 'success',
      message:
        'Account created. Please check your email to verify your account.',
    });
  },
);

export const checkAuthHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user!;

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          profileImage: user.profileImage,
        },
      },
    });
  },
);

export const verifyEmailHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.query as VerifyEmailInput;

    await authService.verifyEmail(token);

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully. You can now log in.',
    });
  },
);

export const loginHandler = catchAsync(
  async (
    req: Request<{}, {}, LoginUserInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const { token, user } = await authService.loginUser(req.body);

    res.cookie('jwt', token, cookieOptions);

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  },
);

export const forgotPasswordHandler = catchAsync(
  async (
    req: Request<{}, {}, ForgotPasswordInput>,
    res: Response,
    next: NextFunction,
  ) => {
    await authService.forgotPassword(req.body);

    res.status(200).json({
      status: 'success',
      message:
        'If an account with that email exists, a reset link has been sent.',
    });
  },
);

export const resetPasswordHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.params as ResetPasswordTokenInput;
    const body = req.body as ResetPasswordInput;

    await authService.resetPassword(token, body);

    res.status(200).json({
      status: 'success',
      message:
        'Password reset successfully. You can now log in with your new password.',
    });
  },
);

export const updatePasswordHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;

    const body = req.body as UpdatePasswordInput;

    const token = await authService.updatePassword(userId, body);

    res.cookie('jwt', token, cookieOptions);

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully.',
    });
  },
);

export const googleAuthHandler = catchAsync(
  async (
    req: Request<{}, {}, GoogleAuthInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const { code } = req.body;

    const { token, user } = await authService.googleAuth(code);
    res.cookie('jwt', token, cookieOptions);

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  },
);

export const logoutHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.cookie('jwt', 'loggedout', {
      ...cookieOptions,
      expires: new Date(Date.now() + 10 * 1000),
    });

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully.',
    });
  },
);
