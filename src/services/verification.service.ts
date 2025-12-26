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
import { verifyPassport, checkPassportExists } from './passport.service.js';
import { PassportVerificationInput } from '../types/passport.types.js';
import { verifyLicense, checkLicenseDuplicate } from './license.service.js';
import { LicenseVerificationInput } from '../types/license.types.js';

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

export const handlePassportVerification = async (
  userId: string,
  input: PassportVerificationInput,
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (user.isIdentityVerified) {
    logger.warn(
      {
        userId,
        currentMethod: user.identityVerificationMethod,
      },
      'Attempted passport verification on already verified user',
    );
    throw new AppError(
      `Your identity is already verified via ${user.identityVerificationMethod}. You cannot verify again.`,
      400,
    );
  }

  logger.info({ userId }, 'Starting passport verification process');

  try {
    const verificationResult = await verifyPassport(input);

    if (!verificationResult.approved) {
      logger.warn(
        {
          userId,
          reason: verificationResult.reason,
          validations: verificationResult.validations,
        },
        'Passport verification rejected',
      );

      return {
        success: false,
        approved: false,
        reason: verificationResult.reason,
        validations: verificationResult.validations,
        biometricResult: verificationResult.biometricResult
          ? {
              similarity: verificationResult.biometricResult.similarity,
              faceMatches: verificationResult.biometricResult.faceMatches,
            }
          : undefined,
      };
    }

    const passportNumber = verificationResult.passportData!.passportNumber;
    const passportExists = await checkPassportExists(passportNumber);

    if (passportExists) {
      logger.warn(
        {
          userId,
          passportNumber,
        },
        'Attempted to use duplicate passport number',
      );
      throw new AppError(
        'This passport is already registered in our system. Each passport can only be used once.',
        409,
      );
    }

    user.isIdentityVerified = true;
    user.identityVerifiedAt = new Date();
    user.identityVerificationMethod = 'passport';
    user.passportData = {
      passportNumber: verificationResult.passportData!.passportNumber,
      nationality: verificationResult.passportData!.nationality,
      fullName: verificationResult.passportData!.fullName,
      firstName: verificationResult.passportData!.firstName,
      lastName: verificationResult.passportData!.lastName,
      birthdate: verificationResult.passportData!.birthdate,
      expiryDate: verificationResult.passportData!.expiryDate,
      sex: verificationResult.passportData!.sex,
      similarityScore: verificationResult.biometricResult!.similarity,
      verifiedAt: new Date(),
      mrzRaw: verificationResult.passportData!.mrzRaw,
    };

    await user.save();

    logger.info(
      {
        userId,
        passportNumber,
        nationality: verificationResult.passportData!.nationality,
        similarityScore:
          verificationResult.biometricResult!.similarity.toFixed(2),
      },
      'Passport verification completed successfully',
    );

    return {
      success: true,
      approved: true,
      message: 'Identity verified successfully via passport',
      user: {
        id: (user._id as mongoose.Types.ObjectId).toString(),
        isIdentityVerified: user.isIdentityVerified,
        identityVerificationMethod: user.identityVerificationMethod,
        identityVerifiedAt: user.identityVerifiedAt,
        passportData: {
          passportNumber: user.passportData!.passportNumber,
          nationality: user.passportData!.nationality,
          fullName: user.passportData!.fullName,
          birthdate: user.passportData!.birthdate,
          expiryDate: user.passportData!.expiryDate,
          sex: user.passportData!.sex,
          similarityScore: user.passportData!.similarityScore,
          verifiedAt: user.passportData!.verifiedAt,
        },
      },
      validations: verificationResult.validations,
      biometricResult: {
        similarity: verificationResult.biometricResult!.similarity,
        faceMatches: verificationResult.biometricResult!.faceMatches,
        confidence: verificationResult.biometricResult!.confidence,
      },
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
      'Unexpected error during passport verification',
    );

    throw new AppError(
      'Failed to complete passport verification. Please try again.',
      500,
    );
  }
};

export const handleLicenseVerification = async (
  userId: string,
  input: LicenseVerificationInput,
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (!user.isIdentityVerified) {
    logger.warn(
      { userId },
      'Attempted license verification without identity verification',
    );
    throw new AppError(
      'Please verify your identity (Fayda or Passport) before verifying your license. Go to Profile → Verification.',
      403,
    );
  }

  if (user.isDrivingLicenseVerified) {
    logger.warn(
      {
        userId,
        licenseNumber: user.licenseData?.licenseNumber,
      },
      'Attempted license verification on already verified user',
    );
    throw new AppError('Your driving license is already verified.', 400);
  }

  logger.info(
    { userId, licenseType: input.licenseType },
    'Starting license verification process',
  );

  try {
    const verificationResult = await verifyLicense(input, userId);

    if (!verificationResult.approved) {
      logger.warn(
        {
          userId,
          reason: verificationResult.reason,
          validations: verificationResult.validations,
        },
        'License verification rejected',
      );

      return {
        success: false,
        approved: false,
        reason: verificationResult.reason,
        validations: verificationResult.validations,
        matchingResult: verificationResult.matchingResult
          ? {
              nameMatchScore: verificationResult.matchingResult.nameMatchScore,
              dobMatch: verificationResult.matchingResult.dobMatch,
              identitySource: verificationResult.matchingResult.identitySource,
            }
          : undefined,
      };
    }

    const licenseNumber = verificationResult.licenseData!.licenseNumber;
    const licenseExists = await checkLicenseDuplicate(licenseNumber);

    if (licenseExists) {
      logger.warn(
        {
          userId,
          licenseNumber,
        },
        'Attempted to use duplicate license number',
      );
      throw new AppError(
        'This license is already registered in our system. Each license can only be used once.',
        409,
      );
    }

    user.isDrivingLicenseVerified = true;
    user.licenseVerifiedAt = new Date();
    user.licenseData = {
      licenseNumber: verificationResult.licenseData!.licenseNumber,
      fullName: verificationResult.licenseData!.fullName,
      birthdate: verificationResult.licenseData!.birthdate,
      expiryDate: verificationResult.licenseData!.expiryDate,
      issueDate: verificationResult.licenseData!.issueDate,
      licenseClass: verificationResult.licenseData!.licenseClass,
      bloodType: verificationResult.licenseData!.bloodType,
      nationality: verificationResult.licenseData!.nationality,
      isInternationalLicense:
        verificationResult.licenseData!.isInternationalLicense,
      countryOfIssue: verificationResult.licenseData!.countryOfIssue,
      nameMatchScore: verificationResult.matchingResult!.nameMatchScore,
      dobMatch: verificationResult.matchingResult!.dobMatch,
      ocrRawFront: verificationResult.licenseData!.ocrRawFront,
      ocrRawBack: verificationResult.licenseData!.ocrRawBack,
      verifiedAt: new Date(),
    };

    await user.save();

    logger.info(
      {
        userId,
        licenseNumber,
        licenseClass: verificationResult.licenseData!.licenseClass.join(', '),
        nameMatchScore:
          verificationResult.matchingResult!.nameMatchScore.toFixed(2),
      },
      'License verification completed successfully',
    );

    return {
      success: true,
      approved: true,
      message: 'License verified successfully',
      user: {
        id: (user._id as mongoose.Types.ObjectId).toString(),
        isDrivingLicenseVerified: user.isDrivingLicenseVerified,
        licenseVerifiedAt: user.licenseVerifiedAt,
        licenseData: {
          licenseNumber: user.licenseData!.licenseNumber,
          fullName: user.licenseData!.fullName,
          birthdate: user.licenseData!.birthdate,
          expiryDate: user.licenseData!.expiryDate,
          licenseClass: user.licenseData!.licenseClass,
          nationality: user.licenseData!.nationality,
          isInternationalLicense: user.licenseData!.isInternationalLicense,
          countryOfIssue: user.licenseData!.countryOfIssue,
          nameMatchScore: user.licenseData!.nameMatchScore,
          dobMatch: user.licenseData!.dobMatch,
          verifiedAt: user.licenseData!.verifiedAt,
        },
      },
      validations: verificationResult.validations,
      matchingResult: {
        nameMatchScore: verificationResult.matchingResult!.nameMatchScore,
        dobMatch: verificationResult.matchingResult!.dobMatch,
        identitySource: verificationResult.matchingResult!.identitySource,
      },
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
      'Unexpected error during license verification',
    );

    throw new AppError(
      'Failed to complete license verification. Please try again.',
      500,
    );
  }
};

export const getVerificationStatus = async (userId: string) => {
  const user = await User.findById(userId).select(
    '+faydaId +isIdentityVerified +identityVerifiedAt +identityVerificationMethod +faydaData +passportData +isDrivingLicenseVerified +licenseVerifiedAt +licenseData',
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
    passportData: user.passportData
      ? {
          passportNumber: user.passportData.passportNumber,
          nationality: user.passportData.nationality,
          fullName: user.passportData.fullName,
          firstName: user.passportData.firstName,
          lastName: user.passportData.lastName,
          birthdate: user.passportData.birthdate,
          expiryDate: user.passportData.expiryDate,
          sex: user.passportData.sex,
          similarityScore: user.passportData.similarityScore,
          verifiedAt: user.passportData.verifiedAt,
        }
      : null,
    isDrivingLicenseVerified: user.isDrivingLicenseVerified || false,
    licenseVerifiedAt: user.licenseVerifiedAt || null,
    licenseData: user.licenseData
      ? {
          licenseNumber: user.licenseData.licenseNumber,
          fullName: user.licenseData.fullName,
          birthdate: user.licenseData.birthdate,
          expiryDate: user.licenseData.expiryDate,
          issueDate: user.licenseData.issueDate,
          licenseClass: user.licenseData.licenseClass,
          bloodType: user.licenseData.bloodType,
          nationality: user.licenseData.nationality,
          isInternationalLicense: user.licenseData.isInternationalLicense,
          countryOfIssue: user.licenseData.countryOfIssue,
          nameMatchScore: user.licenseData.nameMatchScore,
          dobMatch: user.licenseData.dobMatch,
          verifiedAt: user.licenseData.verifiedAt,
        }
      : null,
  };
};

export const revokeVerification = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (!user.isIdentityVerified && !user.isDrivingLicenseVerified) {
    throw new AppError('User has no active verifications to revoke.', 400);
  }

  const previousIdentityMethod = user.identityVerificationMethod;
  const hadLicenseVerified = user.isDrivingLicenseVerified;

  user.isIdentityVerified = false;
  user.identityVerifiedAt = undefined;
  user.identityVerificationMethod = undefined;
  user.faydaId = undefined;
  user.faydaData = undefined;
  user.passportData = undefined;

  user.isDrivingLicenseVerified = false;
  user.licenseVerifiedAt = undefined;
  user.licenseData = undefined;

  await user.save();

  logger.info(
    {
      userId,
      previousIdentityMethod,
      hadLicenseVerified,
    },
    'Verification(s) revoked by admin',
  );

  const messages = [];
  if (previousIdentityMethod) {
    messages.push(
      `${previousIdentityMethod === 'passport' ? 'Passport' : 'Fayda'} verification`,
    );
  }
  if (hadLicenseVerified) {
    messages.push('License verification');
  }

  return {
    message: `${messages.join(' and ')} revoked successfully`,
  };
};
