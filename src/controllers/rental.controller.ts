import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.util.js';
import * as rentalService from '../services/rental.service.js';
import * as bookingService from '../services/booking.service.js';
import {
  CreateRentalListingInput,
  UpdateRentalListingInput,
  GetRentalListingsQuery,
  CheckAvailabilityQuery,
} from '../validation/rental.validation.js';

export const createRentalListingHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const listing = await rentalService.createRentalListing(
      req.user!.id,
      req.body as CreateRentalListingInput,
    );

    res.status(201).json({
      status: 'success',
      data: { listing },
    });
  },
);

export const getMyRentalListingsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const listings = await rentalService.getMyRentalListings(req.user!.id);

    res.status(200).json({
      status: 'success',
      results: listings.length,
      data: { listings },
    });
  },
);

export const getPublicRentalListingsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = (req.validatedQuery || req.query) as unknown as GetRentalListingsQuery;
    const data = await rentalService.getPublicRentalListings(query);

    res.status(200).json({
      status: 'success',
      ...data,
    });
  },
);

export const getRentalListingDetailsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const viewerId = req.user?.id;

    const listing = await rentalService.getRentalListingById(id, viewerId);

    res.status(200).json({
      status: 'success',
      data: { listing },
    });
  },
);

export const checkAvailabilityHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { startDate, endDate } = req.query as unknown as CheckAvailabilityQuery;

    const availability = await bookingService.checkAvailabilityWithDetails(
      id,
      startDate,
      endDate,
    );

    res.status(200).json({
      status: 'success',
      data: availability,
    });
  },
);

export const updateRentalListingHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const listing = await rentalService.updateRentalListing(
      req.user!.id,
      id,
      req.body as UpdateRentalListingInput,
    );

    res.status(200).json({
      status: 'success',
      data: { listing },
    });
  },
);

export const deleteRentalListingHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    await rentalService.deleteRentalListing(req.user!.id, id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  },
);
