import multer from 'multer';
import { Request } from 'express';
import AppError from './appError.util.js';
import config from '../config/env.config.js';
import logger from '../config/logger.config.js';

const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];

  logger.debug(
    {
      fieldname: file.fieldname,
      mimetype: file.mimetype,
      originalname: file.originalname,
    },
    'Validating uploaded file',
  );

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    logger.warn(
      {
        mimetype: file.mimetype,
        originalname: file.originalname,
      },
      'Invalid file type rejected',
    );
    cb(
      new AppError(
        `Invalid file type: ${file.mimetype}. Only JPEG and PNG images are allowed.`,
        400,
      ) as any,
    );
  }
};

const passportFileFilter = imageFileFilter;

export const uploadPassportImages = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.passport.maxFileSize,
    files: 2,
    fields: 2,
  },
  fileFilter: passportFileFilter,
}).fields([
  { name: 'passportImage', maxCount: 1 },
  { name: 'selfieImage', maxCount: 1 },
]);

export const uploadLicenseImages = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.license.maxFileSize,
    files: 2,
    fields: 2,
  },
  fileFilter: imageFileFilter,
}).fields([
  { name: 'frontImage', maxCount: 1 },
  { name: 'backImage', maxCount: 1 },
]);

export const validatePassportImages = (req: any, res: any, next: any) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  logger.debug(
    {
      filesPresent: !!files,
      fieldNames: files ? Object.keys(files) : [],
    },
    'Validating passport images',
  );

  if (!files) {
    logger.warn('No files uploaded');
    throw new AppError(
      'Both passport image and selfie image are required.',
      400,
    );
  }

  if (!files.passportImage || !files.selfieImage) {
    const missing = [];
    if (!files.passportImage) missing.push('passportImage');
    if (!files.selfieImage) missing.push('selfieImage');

    logger.warn({ missing }, 'Missing required file fields');
    throw new AppError(
      `Missing required files: ${missing.join(', ')}. Both passport image and selfie image are required.`,
      400,
    );
  }

  if (files.passportImage.length !== 1 || files.selfieImage.length !== 1) {
    logger.warn(
      {
        passportImageCount: files.passportImage?.length || 0,
        selfieImageCount: files.selfieImage?.length || 0,
      },
      'Incorrect number of files uploaded',
    );
    throw new AppError(
      'Exactly one passport image and one selfie image are required.',
      400,
    );
  }

  logger.info(
    {
      passportImage: {
        originalname: files.passportImage[0].originalname,
        size: files.passportImage[0].size,
        mimetype: files.passportImage[0].mimetype,
      },
      selfieImage: {
        originalname: files.selfieImage[0].originalname,
        size: files.selfieImage[0].size,
        mimetype: files.selfieImage[0].mimetype,
      },
    },
    'Passport images validated successfully',
  );

  next();
};

export const validateLicenseImages = (req: any, res: any, next: any) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  logger.debug(
    {
      filesPresent: !!files,
      fieldNames: files ? Object.keys(files) : [],
    },
    'Validating license images',
  );

  if (!files) {
    logger.warn('No files uploaded');
    throw new AppError('Front image of license is required.', 400);
  }

  if (!files.frontImage) {
    logger.warn('Missing front image');
    throw new AppError('Front image of license is required.', 400);
  }

  if (files.frontImage.length !== 1) {
    logger.warn(
      { frontImageCount: files.frontImage?.length || 0 },
      'Incorrect number of front images',
    );
    throw new AppError('Exactly one front image is required.', 400);
  }

  if (files.backImage && files.backImage.length !== 1) {
    logger.warn(
      { backImageCount: files.backImage?.length || 0 },
      'Incorrect number of back images',
    );
    throw new AppError(
      'If providing back image, exactly one back image is required.',
      400,
    );
  }

  const logData: any = {
    frontImage: {
      originalname: files.frontImage[0].originalname,
      size: files.frontImage[0].size,
      mimetype: files.frontImage[0].mimetype,
    },
  };

  if (files.backImage) {
    logData.backImage = {
      originalname: files.backImage[0].originalname,
      size: files.backImage[0].size,
      mimetype: files.backImage[0].mimetype,
    };
  }

  logger.info(logData, 'License images validated successfully');

  next();
};

export const handleMulterError = (
  error: any,
  req: any,
  res: any,
  next: any,
) => {
  if (error instanceof multer.MulterError) {
    logger.warn(
      {
        code: error.code,
        field: error.field,
        message: error.message,
        path: req.path,
      },
      'Multer error occurred',
    );

    if (error.code === 'LIMIT_FILE_SIZE') {
      const isLicense = req.path.includes('/license');
      const maxSize = isLicense
        ? config.license.maxFileSize
        : config.passport.maxFileSize;
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);

      return next(
        new AppError(
          `File too large. Maximum size is ${maxSizeMB}MB per image.`,
          413,
        ),
      );
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      const isLicense = req.path.includes('/license');
      const message = isLicense
        ? 'Too many files. Maximum 2 files allowed (front and optional back image).'
        : 'Too many files. Only 2 files are allowed (passport image and selfie).';

      return next(new AppError(message, 400));
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      const isLicense = req.path.includes('/license');
      const allowedFields = isLicense
        ? "'frontImage' and 'backImage'"
        : "'passportImage' and 'selfieImage'";

      return next(
        new AppError(
          `Unexpected field: ${error.field}. Only ${allowedFields} fields are allowed.`,
          400,
        ),
      );
    }

    return next(new AppError(`File upload error: ${error.message}`, 400));
  }

  next(error);
};
