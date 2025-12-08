import { Request, Response, NextFunction } from 'express';
import Booking from '../models/booking.model.js';
import AppError from '../utils/appError.util.js';
import logger from '../config/logger.config.js';

export const verifyPaymentCompleted = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const bookingId = req.params.id;

    if (!bookingId) {
      return next(new AppError('Booking ID is required', 400));
    }

    const booking = await Booking.findById(bookingId).select('paymentStatus');

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    if (booking.paymentStatus !== 'paid') {
      logger.warn(
        {
          bookingId,
          paymentStatus: booking.paymentStatus,
          userId: req.user?.id,
        },
        'Attempted booking action without completed payment',
      );

      return next(
        new AppError(
          'Payment must be completed before performing this action.',
          402,
        ),
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const preventDuplicateRefund = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const bookingId = req.params.id;

    if (!bookingId) {
      return next(new AppError('Booking ID is required', 400));
    }

    const booking = await Booking.findById(bookingId).select('paymentStatus');

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    if (booking.paymentStatus === 'refunded') {
      return next(
        new AppError('Refund already processed for this booking', 400),
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
