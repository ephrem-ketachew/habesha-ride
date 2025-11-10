import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.util.js';
import * as carService from '../services/car.service.js';
import {
  createCarSchema,
  GetCarParams,
  updateCarSchema,
} from '../validation/car.validation.js';
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

export const getMyCarsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const ownerId = req.user!.id;
    const cars = await carService.getMyCars(ownerId);

    res.status(200).json({
      status: 'success',
      results: cars.length,
      data: {
        cars,
      },
    });
  },
);

export const getCarHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as GetCarParams;
    const ownerId = req.user!.id;

    const car = await carService.getCarById(id, ownerId);

    res.status(200).json({
      status: 'success',
      data: {
        car,
      },
    });
  },
);

export const updateCarHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id: carId } = req.params as GetCarParams;
    const ownerId = req.user!.id;
    const files = (req.files as Express.Multer.File[]) || [];

    const validationResult = updateCarSchema.safeParse(req.body);

    if (!validationResult.success) {
      if (files.length > 0) {
        const publicIds = getPublicIdsFromFiles(files);
        await deleteCloudinaryResources(publicIds);
      }

      const errorMessages = validationResult.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('. ');
      return next(new AppError(`Invalid input data. ${errorMessages}`, 400));
    }

    const car = await carService.updateCar(
      carId,
      ownerId,
      validationResult.data,
      files,
    );

    res.status(200).json({
      status: 'success',
      data: {
        car,
      },
    });
  },
);

export const deleteCarHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id: carId } = req.params as GetCarParams;
    const ownerId = req.user!.id;

    await carService.deleteCar(carId, ownerId);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  },
);
