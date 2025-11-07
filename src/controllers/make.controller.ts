import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.util.js';
import Make from '../models/make.model.js';

export const getAllMakes = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const makes = await Make.find().sort({ name: 1 });

    res.status(200).json({
      status: 'success',
      results: makes.length,
      data: {
        makes,
      },
    });
  },
);
