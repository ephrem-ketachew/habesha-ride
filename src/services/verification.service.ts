import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import AppError from '../utils/appError.util.js';
import logger from '../config/logger.config.js';
import config from '../config/env.config.js';
import {
  generateCodeVerifier,
  generateCodeChallenge,
} from '../utils/pkce.util.js';
import {
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  getUserInfo,
  decodeUserInfoJWT,
} from '../utils/fayda.util.js';

export const initiateFaydaVerification = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (user.isIdentityVerified) {
    throw new AppError(
      'Your identity is already verified. You cannot verify again.',
      400,
    );
  }

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const state = crypto.randomBytes(32).toString('base64url');

  const claims = {
    userinfo: {
      name: { essential: true },
      birthdate: { essential: true },
      picture: { essential: true },
      phone_number: { essential: false },
      email: { essential: false },
      gender: { essential: false },
      address: { essential: false },
    },
    id_token: {},
  };

  const authorizationUrl = buildAuthorizationUrl(codeChallenge, state, claims);

  logger.info(
    { userId, stateLength: state.length },
    'Fayda verification initiated',
  );

  return {
    authorizationUrl,
    state,
    codeVerifier,
    expiresIn: 600,
  };
};

export const handleFaydaCallback = async (
  userId: string,
  code: string,
  state: string,
  codeVerifier: string,
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (user.isIdentityVerified && user.identityVerificationMethod === 'fayda') {
    throw new AppError('Your identity is already verified with Fayda.', 400);
  }

  logger.info({ userId, codeLength: code.length }, 'Processing Fayda callback');

  try {
    const { access_token, id_token } = await exchangeCodeForTokens(
      code,
      codeVerifier,
      config.fayda.redirectUri,
    );

    const userinfoJWT = await getUserInfo(access_token);

    const userData = decodeUserInfoJWT(userinfoJWT);

    if (!userData.sub) {
      throw new AppError('Invalid userinfo: missing subject identifier.', 400);
    }

    const existingUser = await User.findOne({
      faydaId: userData.sub,
      _id: { $ne: userId },
    });

    if (existingUser) {
      logger.warn(
        {
          userId,
          faydaId: userData.sub,
          existingUserId: existingUser._id,
        },
        'Attempted to link Fayda ID already in use',
      );
      throw new AppError(
        'This Fayda ID is already linked to another account.',
        409,
      );
    }

    user.faydaId = userData.sub;
    user.isIdentityVerified = true;
    user.identityVerifiedAt = new Date();
    user.identityVerificationMethod = 'fayda';
    user.faydaData = {
      sub: userData.sub,
      name: userData.name,
      nameEn: userData.nameEn,
      nameAm: userData.nameAm,
      birthdate: userData.birthdate,
      picture: userData.picture,
      gender: userData.gender,
      address: userData.address,
      phone_number: userData.phone_number,
      email: userData.email,
      verifiedAt: new Date(),
    };

    await user.save();

    logger.info(
      {
        userId,
        faydaId: userData.sub,
        name: userData.name || userData.nameEn,
      },
      'Fayda verification completed successfully',
    );

    return {
      user: {
        id: (user._id as mongoose.Types.ObjectId).toString(),
        isIdentityVerified: user.isIdentityVerified,
        identityVerificationMethod: user.identityVerificationMethod,
        identityVerifiedAt: user.identityVerifiedAt,
        faydaId: user.faydaId,
        faydaData: user.faydaData,
      },
      message: 'Identity verified successfully',
    };
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error(
      {
        error: error.message,
        stack: error.stack,
        userId,
      },
      'Unexpected error during Fayda verification',
    );

    throw new AppError(
      'Failed to complete identity verification. Please try again.',
      500,
    );
  }
};

export const getVerificationStatus = async (userId: string) => {
  const user = await User.findById(userId).select(
    '+faydaId +isIdentityVerified +identityVerifiedAt +identityVerificationMethod +faydaData',
  );

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return {
    isIdentityVerified: user.isIdentityVerified || false,
    identityVerificationMethod: user.identityVerificationMethod || null,
    identityVerifiedAt: user.identityVerifiedAt || null,
    faydaId: user.faydaId || null,
    faydaData: user.faydaData
      ? {
          name: user.faydaData.name || user.faydaData.nameEn,
          nameEn: user.faydaData.nameEn,
          nameAm: user.faydaData.nameAm,
          birthdate: user.faydaData.birthdate,
          picture: user.faydaData.picture,
        }
      : null,
  };
};

export const revokeVerification = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (!user.isIdentityVerified) {
    throw new AppError('User is not verified.', 400);
  }

  user.isIdentityVerified = false;
  user.identityVerifiedAt = undefined;
  user.identityVerificationMethod = undefined;
  user.faydaId = undefined;
  user.faydaData = undefined;

  await user.save();

  logger.info({ userId }, 'Verification revoked by admin');

  return {
    message: 'Verification revoked successfully',
  };
};
