import { ImageAnnotatorClient } from '@google-cloud/vision';
import { ratio, partial_ratio, token_sort_ratio } from 'fuzzball';
import sharp from 'sharp';
import config from '../config/env.config.js';
import logger from '../config/logger.config.js';
import AppError from '../utils/appError.util.js';
import User from '../models/user.model.js';
import {
  LicenseVerificationInput,
  LicenseVerificationResult,
  ParsedLicenseData,
  LicenseMatchingResult,
  OcrResult,
} from '../types/license.types.js';

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

let visionClient: ImageAnnotatorClient | null = null;

const getVisionClient = (): ImageAnnotatorClient => {
  if (!visionClient) {
    visionClient = initGoogleVisionClient();
  }
  return visionClient;
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
      'License image preprocessed',
    );

    return processed;
  } catch (error: any) {
    logger.error({ error: error.message }, 'Image preprocessing failed');
    throw new AppError(
      'Failed to process image. Please ensure the image is clear and not corrupted.',
      400,
    );
  }
};

const extractLicenseText = async (
  frontBuffer: Buffer,
  backBuffer?: Buffer,
): Promise<OcrResult> => {
  const client = getVisionClient();

  try {
    logger.debug('Extracting text from license front image');
    const [frontResult] = await client.documentTextDetection({
      image: { content: frontBuffer },
    });

    const frontText =
      frontResult.fullTextAnnotation?.text ||
      frontResult.textAnnotations?.[0]?.description ||
      '';

    if (!frontText || frontText.length < 10) {
      logger.warn(
        { textLength: frontText.length },
        'No text detected on license front',
      );
      throw new AppError(
        'Could not read license text. Please ensure the image is clear, well-lit, and not blurry.',
        400,
      );
    }

    logger.info(
      { textLength: frontText.length },
      'License front text extracted successfully',
    );

    let backText: string | undefined;
    if (backBuffer) {
      logger.debug('Extracting text from license back image');
      const [backResult] = await client.documentTextDetection({
        image: { content: backBuffer },
      });

      backText =
        backResult.fullTextAnnotation?.text ||
        backResult.textAnnotations?.[0]?.description ||
        '';

      logger.info(
        { textLength: backText?.length || 0 },
        'License back text extracted successfully',
      );
    }

    return {
      frontText,
      backText,
    };
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error(
      { error: error.message },
      'Google Vision API error during license OCR',
    );
    throw new AppError('OCR service unavailable. Please try again later.', 503);
  }
};

const parseEthiopianLicense = (
  frontText: string,
  backText?: string,
): ParsedLicenseData => {
  logger.debug('Parsing Ethiopian license');

  const combinedText = `${frontText}\n${backText || ''}`;
  const lines = combinedText.split('\n').map((line) => line.trim());

  const licenseNumberPattern =
    /ET[\s\-\/]?[A-Z]{2}[\s\-\/]?\d{7}|license[\s:]+([A-Z0-9\-\/]+)/gi;
  const licenseNumberMatch = combinedText.match(licenseNumberPattern);
  const licenseNumber = licenseNumberMatch
    ? licenseNumberMatch[0]
        .replace(/license[\s:]+/gi, '')
        .replace(/\s+/g, '-')
        .toUpperCase()
    : '';

  if (!licenseNumber) {
    throw new AppError(
      'Could not extract license number. Please ensure the license number is clearly visible.',
      400,
    );
  }

  let fullName = '';
  const namePatterns = [
    /name[\s:]+([A-Z\s]+)/i,
    /ስም[\s:]+([ሀ-፼A-Z\s]+)/,
    /holder[\s:]+([A-Z\s]+)/i,
  ];

  for (const pattern of namePatterns) {
    const match = combinedText.match(pattern);
    if (match && match[1]) {
      fullName = match[1].trim();
      break;
    }
  }

  if (!fullName) {
    const capitalizedSequences = combinedText.match(
      /[A-Z]{2,}(?:\s+[A-Z]{2,})*/g,
    );
    if (capitalizedSequences && capitalizedSequences.length > 0) {
      const filtered = capitalizedSequences.filter(
        (seq) =>
          !seq.match(
            /LICENSE|DRIVING|DRIVER|FEDERAL|DEMOCRATIC|REPUBLIC|ETHIOPIA|CLASS|BLOOD|TYPE|ISSUE|EXPIR/i,
          ),
      );
      fullName = filtered[0] || '';
    }
  }

  if (!fullName) {
    throw new AppError(
      'Could not extract name from license. Please ensure the name is clearly visible.',
      400,
    );
  }

  const datePattern =
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/g;
  const dates = combinedText.match(datePattern) || [];

  const normalizeDates = (dateStr: string): string => {
    const parts = dateStr.split(/[\/\-\.]/);
    if (parts.length !== 3) return '';

    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }

    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  };

  const normalizedDates = dates.map(normalizeDates).filter((d) => d);

  const birthdate = normalizedDates[0] || '';
  const expiryDate = normalizedDates[normalizedDates.length - 1] || '';
  const issueDate = normalizedDates.length > 2 ? normalizedDates[1] : undefined;

  if (!birthdate) {
    throw new AppError(
      'Could not extract date of birth. Please ensure dates are clearly visible.',
      400,
    );
  }

  if (!expiryDate) {
    throw new AppError(
      'Could not extract expiry date. Please ensure the expiry date is clearly visible.',
      400,
    );
  }

  const classPattern = /class[\s:]+([A-E,\s]+)/i;
  const classMatch = combinedText.match(classPattern);
  let licenseClass: string[] = [];

  if (classMatch && classMatch[1]) {
    licenseClass = classMatch[1]
      .split(/[,\s]+/)
      .map((c) => c.trim().toUpperCase())
      .filter((c) => /^[A-E]$/.test(c));
  }

  if (licenseClass.length === 0) {
    const classLetters = combinedText.match(/\b[A-E]\b/g);
    if (classLetters) {
      licenseClass = [...new Set(classLetters)];
    }
  }

  if (licenseClass.length === 0) {
    logger.warn('No license class detected, defaulting to [B]');
    licenseClass = ['B'];
  }

  const bloodPattern = /blood[\s:]+([ABO][+-]?)/i;
  const bloodMatch = combinedText.match(bloodPattern);
  const bloodType = bloodMatch ? bloodMatch[1].toUpperCase() : undefined;

  logger.info(
    {
      licenseNumber,
      fullName,
      birthdate,
      expiryDate,
      licenseClass,
      bloodType,
    },
    'Ethiopian license parsed successfully',
  );

  return {
    licenseNumber,
    fullName,
    birthdate,
    expiryDate,
    issueDate,
    licenseClass,
    bloodType,
    nationality: 'ETH',
    countryOfIssue: 'ETH',
    isInternationalLicense: false,
    ocrRawFront: frontText,
    ocrRawBack: backText,
  };
};

const parseInternationalLicense = (
  frontText: string,
  backText?: string,
): ParsedLicenseData => {
  logger.debug('Parsing international license');

  const combinedText = `${frontText}\n${backText || ''}`;

  const licenseNumberPattern = /\b[A-Z0-9]{6,15}\b/;
  const licenseNumberMatch = combinedText.match(licenseNumberPattern);
  const licenseNumber = licenseNumberMatch ? licenseNumberMatch[0] : '';

  if (!licenseNumber) {
    throw new AppError(
      'Could not extract license number. Please ensure the license number is clearly visible.',
      400,
    );
  }

  let fullName = '';
  const namePatterns = [
    /name[\s:]+([A-Z\s]+)/i,
    /surname[\s:]+([A-Z\s]+)/i,
    /holder[\s:]+([A-Z\s]+)/i,
  ];

  for (const pattern of namePatterns) {
    const match = combinedText.match(pattern);
    if (match && match[1]) {
      fullName = match[1].trim();
      break;
    }
  }

  if (!fullName) {
    const capitalizedSequences = combinedText.match(
      /[A-Z]{2,}(?:\s+[A-Z]{2,})*/g,
    );
    if (capitalizedSequences && capitalizedSequences.length > 0) {
      fullName = capitalizedSequences[0];
    }
  }

  if (!fullName) {
    throw new AppError(
      'Could not extract name from license. Please ensure the name is clearly visible.',
      400,
    );
  }

  const datePattern =
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/g;
  const dates = combinedText.match(datePattern) || [];

  const normalizeDate = (dateStr: string): string => {
    const parts = dateStr.split(/[\/\-\.]/);
    if (parts.length !== 3) return '';

    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }

    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  };

  const normalizedDates = dates.map(normalizeDate).filter((d) => d);

  const birthdate = normalizedDates[0] || '';
  const expiryDate = normalizedDates[normalizedDates.length - 1] || '';
  const issueDate = normalizedDates.length > 2 ? normalizedDates[1] : undefined;

  if (!birthdate || !expiryDate) {
    throw new AppError(
      'Could not extract dates from license. Please ensure all dates are clearly visible.',
      400,
    );
  }

  const classPattern = /class[\s:]+([A-E0-9,\s]+)/i;
  const classMatch = combinedText.match(classPattern);
  let licenseClass: string[] = [];

  if (classMatch && classMatch[1]) {
    licenseClass = classMatch[1]
      .split(/[,\s]+/)
      .map((c) => c.trim().toUpperCase())
      .filter((c) => /^[A-E0-9]+$/.test(c));
  }

  if (licenseClass.length === 0) {
    licenseClass = ['B'];
  }

  const countryPattern = /\b(USA|GBR|CAN|AUS|FRA|DEU|IND|CHN|JPN)\b/;
  const countryMatch = combinedText.match(countryPattern);
  const countryOfIssue = countryMatch ? countryMatch[0] : 'UNKNOWN';

  const isIDP =
    combinedText.includes('INTERNATIONAL') && combinedText.includes('PERMIT');

  logger.info(
    {
      licenseNumber,
      fullName,
      birthdate,
      expiryDate,
      licenseClass,
      countryOfIssue,
      isIDP,
    },
    'International license parsed successfully',
  );

  return {
    licenseNumber,
    fullName,
    birthdate,
    expiryDate,
    issueDate,
    licenseClass,
    nationality: countryOfIssue,
    countryOfIssue,
    isInternationalLicense: true,
    ocrRawFront: frontText,
    ocrRawBack: backText,
  };
};

const parseLicenseData = (
  frontText: string,
  backText: string | undefined,
  licenseType: 'ethiopian' | 'international',
): ParsedLicenseData => {
  try {
    if (licenseType === 'ethiopian') {
      return parseEthiopianLicense(frontText, backText);
    } else {
      return parseInternationalLicense(frontText, backText);
    }
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error(
      { error: error.message, licenseType },
      'License parsing failed',
    );
    throw new AppError(
      'Failed to parse license data. Please ensure the image is clear and all information is visible.',
      400,
    );
  }
};

const validateLicenseExpiry = (
  expiryDate: string,
  minMonths: number,
): boolean => {
  try {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const minValidDate = new Date();
    minValidDate.setMonth(today.getMonth() + minMonths);

    return expiry >= minValidDate;
  } catch (error) {
    logger.error({ expiryDate }, 'Invalid expiry date format');
    return false;
  }
};

const fuzzyMatchName = (
  licenseName: string,
  identityName: string,
  threshold: number,
): { match: boolean; score: number } => {
  const normalize = (name: string) =>
    name.trim().toUpperCase().replace(/\s+/g, ' ');

  const normalized1 = normalize(licenseName);
  const normalized2 = normalize(identityName);

  const basicScore = ratio(normalized1, normalized2);
  const partialScore = partial_ratio(normalized1, normalized2);
  const tokenSortScore = token_sort_ratio(normalized1, normalized2);

  let bestScore = Math.max(basicScore, partialScore, tokenSortScore);

  const words1 = normalized1.split(' ');
  const words2 = normalized2.split(' ');
  if (words1.length > 1 && words2.length > 1) {
    const reversed1 = words1.reverse().join(' ');
    const reversed2 = words2.reverse().join(' ');
    const reversedScore = Math.max(
      ratio(normalized1, reversed2),
      ratio(reversed1, normalized2),
    );
    bestScore = Math.max(bestScore, reversedScore);
  }

  logger.debug(
    {
      licenseName: normalized1,
      identityName: normalized2,
      score: bestScore,
      threshold,
    },
    'Fuzzy name matching result',
  );

  return {
    match: bestScore >= threshold,
    score: bestScore,
  };
};

const exactMatchDOB = (licenseDOB: string, identityDOB: string): boolean => {
  const normalizeDOB = (dob: string): string => {
    try {
      const date = new Date(dob);
      return date.toISOString().split('T')[0];
    } catch {
      return dob;
    }
  };

  const normalized1 = normalizeDOB(licenseDOB);
  const normalized2 = normalizeDOB(identityDOB);

  const match = normalized1 === normalized2;

  logger.debug(
    {
      licenseDOB: normalized1,
      identityDOB: normalized2,
      match,
    },
    'DOB matching result',
  );

  return match;
};

const validateLicenseClass = (licenseClasses: string[]): boolean => {
  const validClasses = ['B', 'C', 'D', 'E'];
  return licenseClasses.some((cls) => validClasses.includes(cls));
};

export const verifyLicense = async (
  input: LicenseVerificationInput,
  userId: string,
): Promise<LicenseVerificationResult> => {
  logger.info(
    { userId, licenseType: input.licenseType },
    'Starting license verification',
  );

  const validations = {
    ocrSuccess: false,
    notExpired: false,
    nameMatch: false,
    dobMatch: false,
    licenseClassValid: false,
  };

  try {
    const user = await User.findById(userId);
    if (!user || !user.isIdentityVerified) {
      throw new AppError(
        'User identity must be verified before license verification',
        403,
      );
    }

    const identitySource = user.identityVerificationMethod as
      | 'fayda'
      | 'passport';
    const identityName =
      user.faydaData?.name ||
      user.passportData?.fullName ||
      `${user.firstName} ${user.lastName}`;
    const identityDOB =
      user.faydaData?.birthdate || user.passportData?.birthdate || '';

    if (!identityName || !identityDOB) {
      throw new AppError(
        'Identity data incomplete. Please re-verify your identity.',
        400,
      );
    }

    logger.debug(
      { identitySource, identityName, identityDOB },
      'User identity data retrieved',
    );

    const frontProcessed = await preprocessImage(input.frontImage.buffer);
    const backProcessed = input.backImage
      ? await preprocessImage(input.backImage.buffer)
      : undefined;

    const ocrResult = await extractLicenseText(frontProcessed, backProcessed);
    validations.ocrSuccess = true;

    const licenseData = parseLicenseData(
      ocrResult.frontText,
      ocrResult.backText,
      input.licenseType,
    );

    validations.notExpired = validateLicenseExpiry(
      licenseData.expiryDate,
      config.license.minValidityMonths,
    );

    if (!validations.notExpired) {
      const expiry = new Date(licenseData.expiryDate);
      const today = new Date();
      const monthsRemaining = Math.floor(
        (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30),
      );

      if (monthsRemaining < 0) {
        return {
          approved: false,
          reason: `Your license expired on ${licenseData.expiryDate}. Please renew your license before booking.`,
          validations,
        };
      } else {
        return {
          approved: false,
          reason: `Your license expires on ${licenseData.expiryDate} (in ${monthsRemaining} month${monthsRemaining === 1 ? '' : 's'}). License must be valid for at least ${config.license.minValidityMonths} months.`,
          validations,
        };
      }
    }

    validations.licenseClassValid = validateLicenseClass(
      licenseData.licenseClass,
    );

    if (!validations.licenseClassValid) {
      return {
        approved: false,
        reason: `Your license class (${licenseData.licenseClass.join(', ')}) is not valid for vehicle rental. Required: B, C, D, or E.`,
        validations,
      };
    }

    const nameMatchResult = fuzzyMatchName(
      licenseData.fullName,
      identityName,
      config.license.nameMatchThreshold,
    );
    validations.nameMatch = nameMatchResult.match;

    if (!validations.nameMatch) {
      return {
        approved: false,
        reason: `The name on your license (${licenseData.fullName}) does not match your verified identity (${identityName}). Match score: ${nameMatchResult.score.toFixed(1)}%. Please ensure you're uploading YOUR license.`,
        validations,
      };
    }

    validations.dobMatch = exactMatchDOB(licenseData.birthdate, identityDOB);

    if (!validations.dobMatch) {
      return {
        approved: false,
        reason: `The date of birth on your license (${licenseData.birthdate}) does not match your verified identity (${identityDOB}).`,
        validations,
      };
    }

    const matchingResult: LicenseMatchingResult = {
      nameMatch: true,
      nameMatchScore: nameMatchResult.score,
      dobMatch: true,
      identitySource,
    };

    logger.info(
      {
        userId,
        licenseNumber: licenseData.licenseNumber,
        nameMatchScore: nameMatchResult.score,
      },
      'License verification successful',
    );

    return {
      approved: true,
      licenseData,
      matchingResult,
      validations,
    };
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error(
      { userId, error: error.message },
      'License verification failed',
    );
    throw new AppError('License verification failed. Please try again.', 500);
  }
};

export const checkLicenseDuplicate = async (
  licenseNumber: string,
): Promise<boolean> => {
  try {
    const existingUser = await User.findOne({
      'licenseData.licenseNumber': licenseNumber,
    });

    return !!existingUser;
  } catch (error: any) {
    logger.error(
      { licenseNumber, error: error.message },
      'Error checking license duplicate',
    );
    throw new AppError('Database error. Please try again.', 500);
  }
};

export const revokeLicenseVerification = async (
  userId: string,
): Promise<void> => {
  try {
    await User.findByIdAndUpdate(userId, {
      $set: {
        isDrivingLicenseVerified: false,
        licenseVerifiedAt: null,
      },
      $unset: {
        licenseData: '',
      },
    });

    logger.info({ userId }, 'License verification revoked');
  } catch (error: any) {
    logger.error(
      { userId, error: error.message },
      'Error revoking license verification',
    );
    throw new AppError('Failed to revoke license verification.', 500);
  }
};
