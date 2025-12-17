import mongoose from 'mongoose';
import Booking from '../models/booking.model.js';
import RentalListing from '../models/rentalListing.model.js';
import Car from '../models/car.model.js';
import User from '../models/user.model.js';
import { CreateBookingInput } from '../validation/booking.validation.js';
import AppError from '../utils/appError.util.js';
import { IUserDocument } from '../types/user.types.js';
import { IPriceBreakdown, IBookingDocument } from '../types/booking.types.js';
import logger from '../config/logger.config.js';
import config from '../config/env.config.js';
import { sendEmail } from '../utils/email.util.js';

const SERVICE_FEE_PERCENT = 0.05;
const MAX_ODOMETER_TOLERANCE_KM = 100;
const MAX_REASONABLE_DAILY_MILEAGE_KM = 1000;

const calculateDays = (start: Date, end: Date): number => {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
};

const isPopulated = <T>(field: mongoose.Types.ObjectId | T): field is T => {
  return !(field instanceof mongoose.Types.ObjectId);
};

export const checkAvailability = async (
  listingId: string,
  startDate: Date,
  endDate: Date,
) => {
  const listing = await RentalListing.findById(listingId);
  if (!listing) throw new AppError('Listing not found', 404);

  const isBlockedInListing = listing.unavailableRanges.some((range) => {
    const rangeStart = new Date(range.startDate);
    const rangeEnd = new Date(range.endDate);
    return startDate < rangeEnd && endDate > rangeStart;
  });

  if (isBlockedInListing) {
    return false;
  }

  const overlappingBooking = await Booking.findOne({
    listing: listingId,
    status: {
      $in: ['pending', 'confirmed', 'active'],
    },
    startDate: { $lt: endDate },
    endDate: { $gt: startDate },
  });

  return !overlappingBooking;
};

export const checkAvailabilityWithDetails = async (
  listingId: string,
  startDate: Date,
  endDate: Date,
) => {
  const listing = await RentalListing.findById(listingId);
  if (!listing) throw new AppError('Listing not found', 404);

  const conflictingDates: Array<{
    startDate: Date;
    endDate: Date;
    reason: 'unavailable_range' | 'booking';
    type?: string;
  }> = [];

  // Check unavailable ranges
  listing.unavailableRanges.forEach((range) => {
    const rangeStart = new Date(range.startDate);
    const rangeEnd = new Date(range.endDate);
    if (startDate < rangeEnd && endDate > rangeStart) {
      conflictingDates.push({
        startDate: rangeStart,
        endDate: rangeEnd,
        reason: 'unavailable_range',
        type: range.reason || 'manual_block',
      });
    }
  });

  // Check overlapping bookings
  const overlappingBookings = await Booking.find({
    listing: listingId,
    status: {
      $in: ['pending', 'confirmed', 'active'],
    },
    startDate: { $lt: endDate },
    endDate: { $gt: startDate },
  }).select('startDate endDate status');

  overlappingBookings.forEach((booking) => {
    conflictingDates.push({
      startDate: booking.startDate,
      endDate: booking.endDate,
      reason: 'booking',
    });
  });

  const isAvailable = conflictingDates.length === 0;

  return {
    isAvailable,
    conflictingDates,
  };
};

export const createBooking = async (
  renterId: string,
  input: CreateBookingInput & { deliveryRequested?: boolean },
) => {
  const { listingId, startDate, endDate, deliveryRequested } = input;

  const listing = await RentalListing.findById(listingId).populate('car');
  if (!listing) throw new AppError('Listing not found', 404);

  if (listing.status !== 'listed') {
    throw new AppError('This car is currently not available for rent.', 400);
  }

  if (!listing.owner) {
    throw new AppError('Listing owner information is missing.', 500);
  }

  const getOwnerId = (
    owner: mongoose.Types.ObjectId | IUserDocument | undefined,
  ): mongoose.Types.ObjectId => {
    if (!owner) {
      throw new AppError('Owner information is missing.', 500);
    }
    if (owner instanceof mongoose.Types.ObjectId) {
      return owner;
    }
    const userDoc = owner as unknown as IUserDocument;
    return userDoc._id as mongoose.Types.ObjectId;
  };

  const ownerIdObj = getOwnerId(listing.owner);
  const ownerIdStr = ownerIdObj.toString();

  if (ownerIdStr === renterId) {
    throw new AppError('You cannot book your own car.', 400);
  }

  const now = new Date();
  const minStartDate = new Date(
    now.getTime() + listing.advanceNoticeHours * 60 * 60 * 1000,
  );
  if (startDate < minStartDate) {
    throw new AppError(
      `Booking must be made at least ${listing.advanceNoticeHours} hours in advance.`,
      400,
    );
  }

  const days = calculateDays(startDate, endDate);

  if (days < listing.minRentalDurationDays) {
    throw new AppError(
      `Minimum rental duration is ${listing.minRentalDurationDays} days.`,
      400,
    );
  }
  if (days > listing.maxRentalDurationDays) {
    throw new AppError(
      `Maximum rental duration is ${listing.maxRentalDurationDays} days.`,
      400,
    );
  }

  const isAvailable = await checkAvailability(listingId, startDate, endDate);
  if (!isAvailable) {
    throw new AppError('Car is not available for the selected dates.', 409);
  }

  const basePrice = Math.round(listing.ratePerDay * days * 100) / 100;

  let discountAmount = 0;
  if (days >= 30 && listing.monthlyDiscountPercent > 0) {
    discountAmount =
      Math.round(basePrice * (listing.monthlyDiscountPercent / 100) * 100) /
      100;
  } else if (days >= 7 && listing.weeklyDiscountPercent > 0) {
    discountAmount =
      Math.round(basePrice * (listing.weeklyDiscountPercent / 100) * 100) / 100;
  }

  let deliveryFee = 0;
  if (deliveryRequested) {
    if (!listing.deliveryAvailable) {
      throw new AppError('Delivery is not available for this car.', 400);
    }
    deliveryFee = listing.deliveryFee || 0;
  }

  const serviceFee =
    Math.round((basePrice - discountAmount) * SERVICE_FEE_PERCENT * 100) / 100;

  const totalPrice =
    Math.round((basePrice - discountAmount + deliveryFee + serviceFee) * 100) /
    100;

  const booking = await Booking.create({
    car: listing.car,
    listing: listing._id,
    renter: renterId,
    owner: ownerIdObj,
    startDate,
    endDate,
    totalPrice,
    securityDeposit: listing.securityDeposit,
    priceBreakdown: {
      basePrice,
      days,
      deliveryFee,
      discountAmount,
      serviceFee,
      excessMileageFee: 0,
    },
    usageLimits: {
      allowedMileagePerDay: listing.allowedMileagePerDay,
      excessMileageFee: listing.excessMileageFee,
    },
    cancellationPolicy: listing.cancellationPolicy,
    status: listing.instantBookingAvailable ? 'confirmed' : 'pending',
    paymentStatus: 'pending',
  });

  const isInstantBooking = listing.instantBookingAvailable;

  if (isInstantBooking) {
    try {
      const [renter, owner] = await Promise.all([
        User.findById(renterId).select('firstName lastName email'),
        User.findById(ownerIdObj).select('firstName lastName email'),
      ]);

      if (renter?.email) {
        const bookingUrl = `${config.clientUrl}/bookings/${String(booking._id)}`;
        const amountDue = totalPrice + listing.securityDeposit;

        await sendEmail({
          to: renter.email,
          subject: 'Instant booking created — complete payment to confirm',
          text: [
            `Hi ${renter.firstName || ''} ${renter.lastName || ''}`.trim() +
              ',',
            '',
            'Your instant booking has been created and reserved for you. Please complete payment to finalize it.',
            '',
            `Booking ID: ${String(booking._id)}`,
            `Start: ${startDate.toISOString()}`,
            `End: ${endDate.toISOString()}`,
            `Amount due (incl. deposit): ${amountDue} ETB`,
            '',
            `View booking & pay: ${bookingUrl}`,
          ].join('\n'),
          html: `
            <p>Hi <strong>${renter.firstName || ''} ${renter.lastName || ''}</strong>,</p>
            <p>Your instant booking has been created and reserved for you. Please complete payment to finalize it.</p>
            <p>
              <strong>Booking ID:</strong> ${String(booking._id)}<br/>
              <strong>Start:</strong> ${startDate.toISOString()}<br/>
              <strong>End:</strong> ${endDate.toISOString()}<br/>
              <strong>Amount due (incl. deposit):</strong> ${amountDue} ETB
            </p>
            <p><a href="${bookingUrl}">View booking & pay</a></p>
          `.trim(),
        });
      }

      if (owner?.email) {
        const bookingUrl = `${config.clientUrl}/bookings/${String(booking._id)}`;
        const renterName = renter
          ? `${renter.firstName || ''} ${renter.lastName || ''}`.trim()
          : 'A renter';

        await sendEmail({
          to: owner.email,
          subject: 'New instant booking received',
          text: [
            `Hi ${owner.firstName || ''} ${owner.lastName || ''}`.trim() + ',',
            '',
            'You have received a new instant booking.',
            '',
            `Booking ID: ${String(booking._id)}`,
            `Renter: ${renterName}`,
            `Start: ${startDate.toISOString()}`,
            `End: ${endDate.toISOString()}`,
            '',
            `View reservation: ${bookingUrl}`,
          ].join('\n'),
          html: `
            <p>Hi <strong>${owner.firstName || ''} ${owner.lastName || ''}</strong>,</p>
            <p>You have received a new instant booking.</p>
            <p>
              <strong>Booking ID:</strong> ${String(booking._id)}<br/>
              <strong>Renter:</strong> ${renterName}<br/>
              <strong>Start:</strong> ${startDate.toISOString()}<br/>
              <strong>End:</strong> ${endDate.toISOString()}
            </p>
            <p><a href="${bookingUrl}">View reservation</a></p>
          `.trim(),
        });
      }
    } catch (emailError) {
      logger.error(
        {
          err: emailError,
          bookingId: booking._id,
          renterId,
          ownerId: ownerIdObj,
        },
        'Failed to send instant booking creation emails',
      );
    }
  }

  return {
    booking,
    requiresPayment: isInstantBooking,
    paymentAmount: isInstantBooking ? totalPrice + listing.securityDeposit : 0,
    nextStep: isInstantBooking
      ? 'initialize_payment'
      : 'wait_for_owner_approval',
    message: isInstantBooking
      ? 'Booking created and confirmed. Please proceed with payment to complete your reservation.'
      : 'Booking request created successfully. Please wait for owner approval before proceeding with payment.',
  };
};

export const getMyBookings = async (
  userId: string,
  role: 'renter' | 'owner',
) => {
  const query = role === 'renter' ? { renter: userId } : { owner: userId };

  const bookings = await Booking.find(query)
    .populate({
      path: 'car',
      select: 'make vehicleModel photos year',
      populate: [
        { path: 'make', select: 'name' },
        { path: 'vehicleModel', select: 'name' },
      ],
    })
    .populate(
      role === 'renter' ? 'owner' : 'renter',
      'firstName lastName profileImage',
    )
    .sort({ createdAt: -1 });

  return bookings;
};

export const getBookingById = async (bookingId: string, userId: string) => {
  const booking = await Booking.findById(bookingId)
    .populate({
      path: 'car',
      populate: [
        { path: 'make', select: 'name' },
        { path: 'vehicleModel', select: 'name' },
        { path: 'homeLocation.city', select: 'name' },
      ],
    })
    .populate('renter', 'firstName lastName email phoneNumber profileImage')
    .populate('owner', 'firstName lastName email phoneNumber profileImage');

  if (!booking) throw new AppError('Booking not found', 404);

  if (!isPopulated(booking.renter) || !isPopulated(booking.owner)) {
    throw new AppError('Booking user information is incomplete.', 500);
  }

  const renter = booking.renter as unknown as IUserDocument;
  const owner = booking.owner as unknown as IUserDocument;
  const renterId = (renter._id as mongoose.Types.ObjectId).toString();
  const ownerId = (owner._id as mongoose.Types.ObjectId).toString();

  if (renterId !== userId && ownerId !== userId) {
    throw new AppError('Not authorized to view this booking.', 403);
  }

  return booking;
};

export const updateBookingStatus = async (
  bookingId: string,
  userId: string,
  status: 'confirmed' | 'rejected' | 'cancelled',
  reason?: string,
) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError('Booking not found', 404);

  const getUserId = (
    user: mongoose.Types.ObjectId | IUserDocument | undefined,
  ): string => {
    if (!user) {
      throw new AppError('User information is missing.', 500);
    }
    if (user instanceof mongoose.Types.ObjectId) {
      return user.toString();
    }
    const userDoc = user as unknown as IUserDocument;
    return (userDoc._id as mongoose.Types.ObjectId).toString();
  };

  const ownerId = getUserId(booking.owner);
  const renterId = getUserId(booking.renter);

  if (status === 'confirmed' || status === 'rejected') {
    if (ownerId !== userId) {
      throw new AppError('Only the owner can confirm or reject bookings.', 403);
    }
    if (booking.status !== 'pending') {
      throw new AppError(
        `Cannot change status from ${booking.status} to ${status}.`,
        400,
      );
    }
  }

  if (status === 'cancelled') {
    return await cancelBooking(bookingId, userId, reason);
  }

  if (booking.status === status) {
    throw new AppError(`Booking is already ${status}.`, 400);
  }

  booking.status = status;
  if (reason) booking.cancellationReason = reason;

  await booking.save();
  return booking;
};

export const startBooking = async (
  bookingId: string,
  userId: string,
  odometerReading: number,
) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError('Booking not found', 404);

  const getUserId = (
    user: mongoose.Types.ObjectId | IUserDocument | undefined,
  ): string => {
    if (!user) {
      throw new AppError('User information is missing.', 500);
    }
    if (user instanceof mongoose.Types.ObjectId) {
      return user.toString();
    }
    const userDoc = user as unknown as IUserDocument;
    return (userDoc._id as mongoose.Types.ObjectId).toString();
  };

  const renterId = getUserId(booking.renter);

  if (renterId !== userId) {
    throw new AppError('Only the renter can start the booking.', 403);
  }

  if (booking.status !== 'confirmed') {
    throw new AppError(
      `Cannot start a booking that is ${booking.status}. Booking must be confirmed.`,
      400,
    );
  }

  if (booking.paymentStatus !== 'paid') {
    throw new AppError(
      'Payment must be completed before starting the booking.',
      400,
    );
  }

  const now = new Date();
  const oneHourBeforeStart = new Date(
    booking.startDate.getTime() - 60 * 60 * 1000,
  );
  if (now < oneHourBeforeStart) {
    throw new AppError(
      'Cannot start booking more than 1 hour before the scheduled start date.',
      400,
    );
  }

  if (booking.odometerReadings.start !== null) {
    throw new AppError(
      'Odometer start reading has already been recorded.',
      400,
    );
  }

  const getCarId = (): mongoose.Types.ObjectId => {
    if (!booking.car) {
      throw new AppError('Car information is missing.', 500);
    }
    if (booking.car instanceof mongoose.Types.ObjectId) {
      return booking.car;
    }
    const carDoc = booking.car as any;
    return (carDoc._id as mongoose.Types.ObjectId) || booking.car;
  };

  const carId = getCarId();
  const car = await Car.findById(carId);
  if (!car) {
    throw new AppError('Car not found.', 404);
  }

  if (car.mileage !== null && car.mileage !== undefined) {
    if (odometerReading < car.mileage) {
      throw new AppError(
        `Start odometer reading (${odometerReading}km) cannot be less than car's current mileage (${car.mileage}km). Odometer readings cannot decrease.`,
        400,
      );
    }

    const mileageIncrease = odometerReading - car.mileage;
    if (mileageIncrease > MAX_ODOMETER_TOLERANCE_KM) {
      throw new AppError(
        `Start odometer reading (${odometerReading}km) exceeds car's current mileage (${car.mileage}km) by more than ${MAX_ODOMETER_TOLERANCE_KM}km. Please verify the reading or update the car's mileage.`,
        400,
      );
    }
  }

  booking.status = 'active';
  booking.odometerReadings.start = odometerReading;

  await booking.save();
  return booking;
};

export const completeBooking = async (
  bookingId: string,
  userId: string,
  odometerReading: number,
) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError('Booking not found', 404);

  const getUserId = (
    user: mongoose.Types.ObjectId | IUserDocument | undefined,
  ): string => {
    if (!user) {
      throw new AppError('User information is missing.', 500);
    }
    if (user instanceof mongoose.Types.ObjectId) {
      return user.toString();
    }
    const userDoc = user as unknown as IUserDocument;
    return (userDoc._id as mongoose.Types.ObjectId).toString();
  };

  const renterId = getUserId(booking.renter);
  const ownerId = getUserId(booking.owner);

  if (renterId !== userId && ownerId !== userId) {
    throw new AppError(
      'Only the renter or owner can complete the booking.',
      403,
    );
  }

  if (booking.status !== 'active') {
    throw new AppError(
      `Cannot complete a booking that is ${booking.status}. Booking must be active.`,
      400,
    );
  }

  const now = new Date();
  if (ownerId === userId && now < booking.endDate) {
    throw new AppError(
      'Owner cannot complete booking before the scheduled end date.',
      400,
    );
  }

  if (booking.odometerReadings.start === null) {
    throw new AppError(
      'Cannot complete booking without start odometer reading.',
      400,
    );
  }

  if (booking.odometerReadings.end !== null) {
    throw new AppError('Odometer end reading has already been recorded.', 400);
  }

  if (odometerReading < booking.odometerReadings.start) {
    throw new AppError(
      'End odometer reading must be greater than or equal to start reading.',
      400,
    );
  }

  const totalMileage = odometerReading - booking.odometerReadings.start;
  const rentalDays = calculateDays(booking.startDate, booking.endDate);

  const averageDailyMileage = totalMileage / rentalDays;
  if (averageDailyMileage > MAX_REASONABLE_DAILY_MILEAGE_KM) {
    throw new AppError(
      `Total mileage (${totalMileage}km over ${rentalDays} day${rentalDays > 1 ? 's' : ''}) exceeds reasonable limit (${MAX_REASONABLE_DAILY_MILEAGE_KM}km/day average). Please verify the odometer reading.`,
      400,
    );
  }

  let excessMileageFee = 0;
  if (
    booking.usageLimits.allowedMileagePerDay !== null &&
    booking.usageLimits.allowedMileagePerDay > 0
  ) {
    const allowedMileage =
      booking.usageLimits.allowedMileagePerDay * rentalDays;
    const excessMileage = Math.max(0, totalMileage - allowedMileage);

    if (excessMileage > 0 && booking.usageLimits.excessMileageFee > 0) {
      excessMileageFee =
        Math.round(excessMileage * booking.usageLimits.excessMileageFee * 100) /
        100;
    }
  }

  booking.priceBreakdown.excessMileageFee = excessMileageFee;

  const { basePrice, discountAmount, deliveryFee, serviceFee } =
    booking.priceBreakdown;
  booking.totalPrice =
    Math.round(
      (basePrice -
        discountAmount +
        deliveryFee +
        serviceFee +
        excessMileageFee) *
        100,
    ) / 100;

  booking.status = 'completed';
  booking.odometerReadings.end = odometerReading;

  await booking.save();

  const getCarId = (): mongoose.Types.ObjectId => {
    if (!booking.car) {
      throw new AppError('Car information is missing.', 500);
    }
    if (booking.car instanceof mongoose.Types.ObjectId) {
      return booking.car;
    }
    const carDoc = booking.car as any;
    return (carDoc._id as mongoose.Types.ObjectId) || booking.car;
  };

  const carId = getCarId();
  await Car.findByIdAndUpdate(carId, {
    mileage: odometerReading,
  });

  return booking;
};

const calculateCancellationRefund = (
  policy: 'flexible' | 'moderate' | 'strict',
  bookingCreatedAt: Date,
  tripStartDate: Date,
  totalPrice: number,
  securityDeposit: number,
  priceBreakdown: IPriceBreakdown,
): { refundAmount: number; cancellationFee: number } => {
  const now = new Date();
  const hoursSinceBooking =
    (now.getTime() - bookingCreatedAt.getTime()) / (1000 * 60 * 60);
  const hoursUntilTrip =
    (tripStartDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursSinceBooking <= 1) {
    return {
      refundAmount: totalPrice,
      cancellationFee: 0,
    };
  }

  const baseRefundableAmount =
    priceBreakdown.basePrice -
    priceBreakdown.discountAmount +
    priceBreakdown.deliveryFee;

  let deductionAmount = 0;

  switch (policy) {
    case 'flexible':
      if (hoursUntilTrip >= 24) {
        deductionAmount = 0;
      } else {
        const ratePerDay = priceBreakdown.basePrice / priceBreakdown.days;
        deductionAmount = ratePerDay;
      }
      break;

    case 'moderate':
      if (hoursUntilTrip >= 72) {
        deductionAmount = 0;
      } else {
        deductionAmount = baseRefundableAmount * 0.5;
      }
      break;

    case 'strict':
      if (hoursUntilTrip >= 168) {
        deductionAmount = baseRefundableAmount * 0.5;
      } else {
        deductionAmount = baseRefundableAmount;
      }
      break;
  }

  const refundFromPrice = baseRefundableAmount - deductionAmount;
  const totalRefund = refundFromPrice + securityDeposit;
  const totalFee = deductionAmount + priceBreakdown.serviceFee;

  return {
    refundAmount: Math.round(totalRefund * 100) / 100,
    cancellationFee: Math.round(totalFee * 100) / 100,
  };
};

export const cancelBooking = async (
  bookingId: string,
  userId: string,
  reason?: string,
): Promise<IBookingDocument> => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError('Booking not found', 404);

  const listing = await RentalListing.findById(booking.listing);
  if (!listing) throw new AppError('Listing not found', 404);

  const getUserId = (
    user: mongoose.Types.ObjectId | IUserDocument | undefined,
  ): string => {
    if (!user) {
      throw new AppError('User information is missing.', 500);
    }
    if (user instanceof mongoose.Types.ObjectId) {
      return user.toString();
    }
    const userDoc = user as unknown as IUserDocument;
    return (userDoc._id as mongoose.Types.ObjectId).toString();
  };

  const renterId = getUserId(booking.renter);
  const ownerId = getUserId(booking.owner);

  if (userId !== renterId && userId !== ownerId) {
    throw new AppError('Not authorized to cancel this booking', 403);
  }

  if (
    ['active', 'completed', 'cancelled', 'rejected'].includes(booking.status)
  ) {
    throw new AppError(
      `Cannot cancel a booking that is ${booking.status}`,
      400,
    );
  }

  let refundAmount = 0;
  let cancellationFee = 0;

  if (userId === ownerId) {
    refundAmount = booking.totalPrice + booking.securityDeposit;
    cancellationFee = 0;
  } else {
    if (booking.status === 'pending') {
      refundAmount = booking.totalPrice + booking.securityDeposit;
      cancellationFee = 0;
    } else {
      const result = calculateCancellationRefund(
        booking.cancellationPolicy || listing.cancellationPolicy,
        booking.createdAt,
        booking.startDate,
        booking.totalPrice,
        booking.securityDeposit,
        booking.priceBreakdown,
      );
      refundAmount = result.refundAmount;
      cancellationFee = result.cancellationFee;
    }
  }

  booking.status = 'cancelled';
  booking.cancellationReason = reason;
  booking.refundAmount = refundAmount;
  booking.cancellationFee = cancellationFee;
  booking.cancelledBy = userId === ownerId ? 'owner' : 'renter';
  booking.cancelledAt = new Date();

  booking.priceBreakdown.refundAmount = refundAmount;
  booking.priceBreakdown.cancellationFee = cancellationFee;

  if (booking.paymentStatus === 'paid' && refundAmount > 0) {
    booking.paymentStatus = 'refunded';
  }

  await booking.save();

  if (booking.paymentStatus === 'refunded' && refundAmount > 0) {
    try {
      const { createRefundTransaction } = await import('./payment.service.js');

      await createRefundTransaction(
        bookingId,
        refundAmount,
        reason || 'Booking cancelled',
      );

      logger.info(
        {
          bookingId,
          refundAmount,
          cancelledBy: booking.cancelledBy,
        },
        'Refund transaction created for cancelled booking',
      );
    } catch (error: any) {
      logger.error(
        {
          bookingId,
          error: error.message,
        },
        'Failed to create refund transaction, but booking was cancelled',
      );
    }
  }

  return booking;
};
