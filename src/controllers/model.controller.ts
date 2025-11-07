import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.util.js';
import VehicleModel from '../models/vehicleModel.model.js';
import { GetModelsByMakeQuery } from '../validation/model.validation.js';

export const getModelsByMake = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { make } = req.query as GetModelsByMakeQuery;

    const models = await VehicleModel.find({ make: make }).sort({
      name: 1,
    });

    res.status(200).json({
      status: 'success',
      results: models.length,
      data: {
        models,
      },
    });
  },
);
