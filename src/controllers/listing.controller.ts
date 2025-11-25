import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.util.js';
import * as listingService from '../services/listing.service.js';

export const getUnifiedListingsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    };

    const data = await listingService.getUnifiedListings(query);

    res.status(200).json({
      status: 'success',
      ...data,
    });
  },
);
