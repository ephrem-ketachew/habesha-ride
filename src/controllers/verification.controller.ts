import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.util.js';
import * as verificationService from '../services/verification.service.js';
import { FaydaCallbackInput } from '../validation/verification.schema.js';
import config from '../config/env.config.js';
import AppError from '../utils/appError.util.js';
import { PassportVerificationInput } from '../types/passport.types.js';

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

export const verifyPassportHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files?.passportImage || !files?.selfieImage) {
      throw new AppError(
        'Both passport image and selfie image are required.',
        400,
      );
    }

    const passportImage = files.passportImage[0];
    const selfieImage = files.selfieImage[0];

    const input: PassportVerificationInput = {
      passportImage: {
        buffer: passportImage.buffer,
        mimetype: passportImage.mimetype,
        size: passportImage.size,
        originalname: passportImage.originalname,
      },
      selfieImage: {
        buffer: selfieImage.buffer,
        mimetype: selfieImage.mimetype,
        size: selfieImage.size,
        originalname: selfieImage.originalname,
      },
    };

    const result = await verificationService.handlePassportVerification(
      userId,
      input,
    );

    if (!result.success) {
      return res.status(200).json({
        status: 'rejected',
        data: result,
      });
    }

    res.status(200).json({
      status: 'success',
      data: result,
    });
  },
);
