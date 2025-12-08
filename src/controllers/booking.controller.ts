import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.util.js';
import * as bookingService from '../services/booking.service.js';
import {
  CreateBookingInput,
  UpdateBookingStatusInput,
  StartBookingInput,
  CompleteBookingInput,
} from '../validation/booking.validation.js';

export const createBookingHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await bookingService.createBooking(
      req.user!.id,
      req.body as CreateBookingInput & { deliveryRequested?: boolean },
    );

    res.status(201).json({
      status: 'success',
      data: result,
    });
  },
);

export const getBookingHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const booking = await bookingService.getBookingById(id, req.user!.id);

    res.status(200).json({
      status: 'success',
      data: { booking },
    });
  },
);

export const getMyBookingsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const bookings = await bookingService.getMyBookings(req.user!.id, 'renter');

    res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: { bookings },
    });
  },
);

export const getMyReservationsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const bookings = await bookingService.getMyBookings(req.user!.id, 'owner');

    res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: { bookings },
    });
  },
);

export const updateBookingStatusHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { status, cancellationReason } = req.body as UpdateBookingStatusInput;

    const booking = await bookingService.updateBookingStatus(
      id,
      req.user!.id,
      status,
      cancellationReason,
    );

    res.status(200).json({
      status: 'success',
      data: { booking },
    });
  },
);

export const startBookingHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { odometer } = req.body as StartBookingInput;

    const booking = await bookingService.startBooking(
      id,
      req.user!.id,
      odometer,
    );

    res.status(200).json({
      status: 'success',
      data: { booking },
    });
  },
);

export const completeBookingHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { odometer } = req.body as CompleteBookingInput;

    const booking = await bookingService.completeBooking(
      id,
      req.user!.id,
      odometer,
    );

    res.status(200).json({
      status: 'success',
      data: { booking },
    });
  },
);
