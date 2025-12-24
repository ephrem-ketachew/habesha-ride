import multer from 'multer';
import { Request } from 'express';
import AppError from './appError.util.js';
import config from '../config/env.config.js';
import logger from '../config/logger.config.js';

const passportFileFilter = (
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
      },
      'Multer error occurred',
    );

    if (error.code === 'LIMIT_FILE_SIZE') {
      const maxSizeMB = (config.passport.maxFileSize / (1024 * 1024)).toFixed(
        1,
      );
      return next(
        new AppError(
          `File too large. Maximum size is ${maxSizeMB}MB per image.`,
          413,
        ),
      );
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      return next(
        new AppError(
          'Too many files. Only 2 files are allowed (passport image and selfie).',
          400,
        ),
      );
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(
        new AppError(
          `Unexpected field: ${error.field}. Only 'passportImage' and 'selfieImage' fields are allowed.`,
          400,
        ),
      );
    }

    return next(new AppError(`File upload error: ${error.message}`, 400));
  }

  next(error);
};
