import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.util.js';
import * as authService from '../services/auth.service.js';
import {
  RegisterUserInput,
  VerifyEmailInput,
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
