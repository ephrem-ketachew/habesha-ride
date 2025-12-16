import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.util.js';
import * as verificationService from '../services/verification.service.js';
import { FaydaCallbackInput } from '../validation/verification.schema.js';
import config from '../config/env.config.js';
import AppError from '../utils/appError.util.js';

const verificationCookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: (config.isProduction ? 'none' : 'strict') as 'none' | 'strict',
  maxAge: 10 * 60 * 1000,
};

export const initiateFaydaVerificationHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;

    const { authorizationUrl, state, codeVerifier } =
      await verificationService.initiateFaydaVerification(userId);

    res.cookie('fayda_verification_state', state, {
      ...verificationCookieOptions,
      signed: true,
    });

    res.cookie('fayda_code_verifier', codeVerifier, {
      ...verificationCookieOptions,
      signed: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        authorizationUrl,
        state,
        expiresIn: 600,
      },
    });
  },
);

export const handleFaydaCallbackHandler = catchAsync(
  async (
    req: Request<{}, {}, FaydaCallbackInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const userId = req.user!.id;
    const { code, state } = req.body;

    const storedState = req.signedCookies?.fayda_verification_state;
    const codeVerifier = req.signedCookies?.fayda_code_verifier;

    if (!storedState || storedState !== state) {
      throw new AppError('Invalid or missing state token.', 401);
    }

    if (!codeVerifier) {
      throw new AppError(
        'Missing code verifier. Please initiate verification again.',
        400,
      );
    }

    const result = await verificationService.handleFaydaCallback(
      userId,
      code,
      state,
      codeVerifier,
    );

    res.clearCookie('fayda_verification_state', {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: config.isProduction ? 'none' : 'strict',
    });
    res.clearCookie('fayda_code_verifier', {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: config.isProduction ? 'none' : 'strict',
    });

    res.status(200).json({
      status: 'success',
      data: result,
    });
  },
);

export const getVerificationStatusHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;

    const status = await verificationService.getVerificationStatus(userId);

    res.status(200).json({
      status: 'success',
      data: status,
    });
  },
);

export const revokeVerificationHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    const result = await verificationService.revokeVerification(userId);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  },
);
