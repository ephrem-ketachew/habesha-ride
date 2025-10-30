import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.util.js';
import * as authService from '../services/auth.service.js';
import { RegisterUserInput } from '../validation/auth.schema.js';

export const registerHandler = catchAsync(
  async (
    req: Request<{}, {}, RegisterUserInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const user = await authService.registerUser(req.body);

    res.status(201).json({
      status: 'success',
      message:
        'Account created. Please check your email to verify your account.',
    });
  },
);
