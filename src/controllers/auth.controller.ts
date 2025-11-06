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

    res.status(200).json({
      status: 'success',
      token,
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

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully.',
      token,
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

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user,
      },
    });
  },
);
