import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.util.js';
import * as carService from '../services/car.service.js';
import { createCarSchema } from '../validation/car.validation.js';
import AppError from '../utils/appError.util.js';
import {
  getPublicIdsFromFiles,
  deleteCloudinaryResources,
} from '../utils/cloudinary.util.js';

export const createCarHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return next(new AppError('You must upload at least 1 car photo.', 400));
    }

    const validationResult = createCarSchema.safeParse(req.body);

    if (!validationResult.success) {
      const publicIds = getPublicIdsFromFiles(files);
      await deleteCloudinaryResources(publicIds);

      const errorMessages = validationResult.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('. ');
      return next(new AppError(`Invalid input data. ${errorMessages}`, 400));
    }

    const ownerId = req.user!.id;

    const car = await carService.createCar(
      validationResult.data,
      files,
      ownerId,
    );

    res.status(201).json({
      status: 'success',
      data: {
        car,
      },
    });
  },
);
