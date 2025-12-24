import { ImageAnnotatorClient } from '@google-cloud/vision';
import {
  RekognitionClient,
  CompareFacesCommand,
} from '@aws-sdk/client-rekognition';
import { parse } from 'mrz';
import sharp from 'sharp';
import config from '../config/env.config.js';
import logger from '../config/logger.config.js';
import AppError from '../utils/appError.util.js';
import {
  PassportVerificationInput,
  PassportVerificationResult,
  ParsedPassportData,
  BiometricResult,
  GoogleVisionResponse,
  MRZData,
} from '../types/passport.types.js';

const initGoogleVisionClient = (): ImageAnnotatorClient => {
  if (config.passport.googleCredentialsPath) {
    logger.debug(
      { path: config.passport.googleCredentialsPath },
      'Initializing Google Vision with file credentials',
    );
    return new ImageAnnotatorClient({
      keyFilename: config.passport.googleCredentialsPath,
    });
  }

  if (config.passport.googleServiceAccountKeyBase64) {
    logger.debug('Initializing Google Vision with base64 credentials');
    const credentials = JSON.parse(
      Buffer.from(
        config.passport.googleServiceAccountKeyBase64,
        'base64',
      ).toString('utf-8'),
    );
    return new ImageAnnotatorClient({
      credentials,
      projectId: config.passport.googleProjectId,
    });
  }

  throw new Error(
    'Google Cloud credentials not configured. Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_SERVICE_ACCOUNT_KEY_BASE64',
  );
};

const initAWSRekognitionClient = (): RekognitionClient => {
  logger.debug(
    { region: config.passport.awsRegion },
    'Initializing AWS Rekognition client',
  );

  return new RekognitionClient({
    region: config.passport.awsRegion,
    credentials: {
      accessKeyId: config.passport.awsAccessKeyId,
      secretAccessKey: config.passport.awsSecretAccessKey,
    },
  });
};

let visionClient: ImageAnnotatorClient | null = null;
let rekognitionClient: RekognitionClient | null = null;

const getVisionClient = (): ImageAnnotatorClient => {
  if (!visionClient) {
    visionClient = initGoogleVisionClient();
  }
  return visionClient;
};

const getRekognitionClient = (): RekognitionClient => {
  if (!rekognitionClient) {
    rekognitionClient = initAWSRekognitionClient();
  }
  return rekognitionClient;
};

const preprocessImage = async (buffer: Buffer): Promise<Buffer> => {
  try {
    const processed = await sharp(buffer)
      .resize(1920, 1920, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: config.passport.imageQuality })
      .toBuffer();

    logger.debug(
      {
        originalSize: buffer.length,
        processedSize: processed.length,
        reduction:
          ((1 - processed.length / buffer.length) * 100).toFixed(1) + '%',
      },
      'Image preprocessed',
    );

    return processed;
  } catch (error: any) {
    logger.error({ error: error.message }, 'Image preprocessing failed');
    throw new AppError(
      'Failed to process image. Please upload a valid image file.',
      400,
    );
  }
};

const extractTextFromPassport = async (
  imageBuffer: Buffer,
): Promise<GoogleVisionResponse> => {
  try {
    const client = getVisionClient();

    logger.debug('Sending image to Google Vision API');
    const [result] = await client.documentTextDetection({
      image: { content: imageBuffer },
    });

    const fullText = result.fullTextAnnotation?.text || '';

    if (!fullText) {
      throw new AppError(
        'No text detected in passport image. Please ensure the image is clear and well-lit.',
        400,
      );
    }

    logger.debug(
      { textLength: fullText.length },
      'Text extracted from passport',
    );

    const lines = fullText.split('\n');
    const mrzLines = lines.filter(
      (line) =>
        line.trim().match(/^P</) || line.trim().match(/^[A-Z0-9<]{30,}$/),
    );

    if (mrzLines.length < 2) {
      throw new AppError(
        'Could not detect the machine-readable zone (MRZ) at the bottom of the passport. Please ensure: 1) The entire passport page is visible, 2) The photo is not blurry, 3) There is no glare covering the bottom lines with "<<<" symbols.',
        400,
      );
    }

    logger.info(
      {
        mrzLineCount: mrzLines.length,
        mrzPreview: mrzLines[0].substring(0, 20) + '...',
      },
      'MRZ lines extracted',
    );

    return {
      fullText,
      mrzLines,
    };
  } catch (error: any) {
    if (error instanceof AppError) throw error;

    logger.error(
      { error: error.message, stack: error.stack },
      'Google Vision API failed',
    );

    if (error.message.includes('PERMISSION_DENIED')) {
      throw new AppError(
        'Cloud Vision API not enabled. Please enable the API in Google Cloud Console.',
        500,
      );
    }

    if (
      error.message.includes('invalid_grant') ||
      error.message.includes('unauthorized')
    ) {
      throw new AppError(
        'Invalid Google Cloud credentials. Please check your service account key.',
        500,
      );
    }

    throw new AppError(
      'Failed to read passport. Please try again with a clearer image.',
      500,
    );
  }
};

const parseMRZ = (mrzLines: string[]): ParsedPassportData => {
  try {
    const mrzText = mrzLines.join('\n');

    logger.debug({ mrzText }, 'Parsing MRZ text');

    const parsed = parse(mrzText);

    if (!parsed.valid) {
      logger.warn(
        {
          mrzText,
          parseResult: parsed,
          error: 'MRZ checksum validation failed',
        },
        'Invalid MRZ detected',
      );

      throw new AppError(
        'Could not read the bottom lines of your passport clearly. This is usually caused by glare or shadows. Please retake the photo with better lighting and ensure the entire MRZ (machine-readable zone) is visible and clear.',
        400,
      );
    }

    const mrzData = parsed.fields as MRZData;

    const parseDate = (yymmdd: string): string => {
      const year = parseInt(yymmdd.substring(0, 2));
      const month = yymmdd.substring(2, 4);
      const day = yymmdd.substring(4, 6);

      const fullYear = year < 50 ? 2000 + year : 1900 + year;

      return `${fullYear}-${month}-${day}`;
    };

    const birthdate = parseDate(mrzData.birthDate);
    const expiryDate = parseDate(mrzData.expirationDate);

    const calculateAge = (birthdate: string): number => {
      const today = new Date();
      const birth = new Date(birthdate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birth.getDate())
      ) {
        age--;
      }

      return age;
    };

    const age = calculateAge(birthdate);

    const passportData: ParsedPassportData = {
      passportNumber: mrzData.documentNumber,
      nationality: mrzData.nationality,
      fullName: `${mrzData.firstName} ${mrzData.lastName}`.trim(),
      firstName: mrzData.firstName,
      lastName: mrzData.lastName,
      birthdate,
      expiryDate,
      sex: mrzData.sex || 'X',
      age,
      mrzRaw: mrzText,
    };

    logger.info(
      {
        passportNumber: passportData.passportNumber,
        nationality: passportData.nationality,
        age: passportData.age,
      },
      'MRZ parsed successfully',
    );

    return passportData;
  } catch (error: any) {
    if (error instanceof AppError) throw error;

    logger.error(
      { error: error.message, mrzText: mrzLines.join('\n') },
      'MRZ parsing failed',
    );

    if (
      error.message.includes('Invalid MRZ') ||
      error.message.includes('checksum')
    ) {
      throw new AppError(
        'Could not read the bottom lines of your passport clearly. This is usually caused by glare or shadows. Please retake the photo with better lighting and ensure the entire MRZ (machine-readable zone) is visible and clear.',
        400,
      );
    }

    throw new AppError(
      'Failed to parse passport data. Please ensure the bottom two lines of your passport (starting with P<) are clearly visible without glare or shadows.',
      400,
    );
  }
};

const compareFaces = async (
  passportBuffer: Buffer,
  selfieBuffer: Buffer,
): Promise<BiometricResult> => {
  try {
    const client = getRekognitionClient();

    logger.debug('Sending images to AWS Rekognition for face comparison');

    const command = new CompareFacesCommand({
      SourceImage: { Bytes: passportBuffer },
      TargetImage: { Bytes: selfieBuffer },
      SimilarityThreshold: config.passport.awsSimilarityThreshold,
    });

    const response = await client.send(command);

    if (!response.FaceMatches || response.FaceMatches.length === 0) {
      logger.warn('No face matches found');
      return {
        similarity: 0,
        faceMatches: false,
        confidence: 0,
      };
    }

    const match = response.FaceMatches[0];
    const similarity = match.Similarity || 0;

    const result: BiometricResult = {
      similarity,
      faceMatches: similarity >= config.passport.awsSimilarityThreshold,
      confidence: match.Face?.Confidence || 0,
      sourceImageFace: response.SourceImageFace
        ? {
            boundingBox: response.SourceImageFace.BoundingBox,
            confidence: response.SourceImageFace.Confidence || 0,
          }
        : undefined,
      targetImageFace: match.Face
        ? {
            boundingBox: match.Face.BoundingBox,
            confidence: match.Face.Confidence || 0,
          }
        : undefined,
    };

    logger.info(
      {
        similarity: result.similarity.toFixed(2),
        threshold: config.passport.awsSimilarityThreshold,
        faceMatches: result.faceMatches,
      },
      'Face comparison completed',
    );

    return result;
  } catch (error: any) {
    logger.error(
      { error: error.message, errorName: error.name },
      'AWS Rekognition failed',
    );

    if (error.name === 'InvalidImageFormatException') {
      throw new AppError(
        'Invalid image format. Please upload JPEG or PNG images.',
        400,
      );
    }

    if (error.name === 'InvalidParameterException') {
      throw new AppError(
        'No face detected in one or both images. Please ensure your face is clearly visible in the selfie and the passport photo is not obscured.',
        400,
      );
    }

    if (error.name === 'AccessDeniedException') {
      throw new AppError(
        'AWS Rekognition access denied. Please check IAM permissions.',
        500,
      );
    }

    throw new AppError('Face comparison failed. Please try again.', 500);
  }
};

export const verifyPassport = async (
  input: PassportVerificationInput,
): Promise<PassportVerificationResult> => {
  logger.info('Starting passport verification process');

  try {
    logger.debug('Step 1: Preprocessing images');
    const [passportProcessed, selfieProcessed] = await Promise.all([
      preprocessImage(input.passportImage.buffer),
      preprocessImage(input.selfieImage.buffer),
    ]);

    logger.debug('Step 2: Running parallel execution (OCR + Face comparison)');
    const [visionResponse, biometricResult] = await Promise.all([
      extractTextFromPassport(passportProcessed),
      compareFaces(passportProcessed, selfieProcessed),
    ]);

    logger.debug('Step 3: Parsing MRZ data');
    const passportData = parseMRZ(visionResponse.mrzLines);

    logger.debug('Step 4: Running Go/No-Go decision logic');
    const validations = {
      mrzValid: true,
      notExpired: new Date(passportData.expiryDate) > new Date(),
      ageValid: passportData.age >= config.passport.minAge,
      faceMatch: biometricResult.faceMatches,
    };

    const approved = Object.values(validations).every((v) => v === true);

    let reason: string | undefined;
    if (!approved) {
      if (!validations.mrzValid) {
        reason = 'Passport MRZ checksum validation failed';
      } else if (!validations.notExpired) {
        reason = `Your passport expired on ${passportData.expiryDate}. Please use a valid passport.`;
      } else if (!validations.ageValid) {
        reason = `You must be at least ${config.passport.minAge} years old to rent a car. Current age: ${passportData.age}`;
      } else if (!validations.faceMatch) {
        reason = `Face match confidence too low (${biometricResult.similarity.toFixed(1)}% < ${config.passport.awsSimilarityThreshold}%). Ensure your selfie is clear and matches your passport photo.`;
      }
    }

    logger.info(
      {
        approved,
        validations,
        reason: reason || 'N/A',
      },
      'Verification decision completed',
    );

    return {
      approved,
      reason,
      passportData: approved ? passportData : undefined,
      biometricResult,
      validations,
    };
  } catch (error: any) {
    if (error instanceof AppError) throw error;

    logger.error(
      { error: error.message, stack: error.stack },
      'Passport verification process failed',
    );
    throw new AppError('Verification process failed. Please try again.', 500);
  }
};

export const checkPassportExists = async (
  passportNumber: string,
): Promise<boolean> => {
  const User = (await import('../models/user.model.js')).default;

  logger.debug({ passportNumber }, 'Checking if passport number exists');

  const existingUser = await User.findOne({
    'passportData.passportNumber': passportNumber,
  });

  const exists = !!existingUser;

  logger.debug(
    { passportNumber, exists },
    'Passport existence check completed',
  );

  return exists;
};

export const revokePassportVerification = async (
  userId: string,
): Promise<void> => {
  const User = (await import('../models/user.model.js')).default;

  logger.info({ userId }, 'Revoking passport verification');

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (
    !user.isIdentityVerified ||
    user.identityVerificationMethod !== 'passport'
  ) {
    throw new AppError(
      'User is not verified via passport. Cannot revoke passport verification.',
      400,
    );
  }

  user.isIdentityVerified = false;
  user.identityVerifiedAt = undefined;
  user.identityVerificationMethod = null;
  user.passportData = undefined;

  await user.save();

  logger.info({ userId }, 'Passport verification revoked successfully');
};
