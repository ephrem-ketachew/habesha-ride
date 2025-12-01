import mongoose from 'mongoose';
import Booking from '../models/booking.model.js';
import RentalListing from '../models/rentalListing.model.js';
import { CreateBookingInput } from '../validation/booking.validation.js';
import AppError from '../utils/appError.util.js';
import { IUserDocument } from '../types/user.types.js';

const SERVICE_FEE_PERCENT = 0.05;

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

  // Calculate base price and round to 2 decimal places to avoid floating point issues
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

  // Calculate service fee on the discounted amount and round
  const serviceFee =
    Math.round((basePrice - discountAmount) * SERVICE_FEE_PERCENT * 100) / 100;

  // Calculate total price and round to 2 decimal places
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
    },
    usageLimits: {
      allowedMileagePerDay: listing.allowedMileagePerDay,
      excessMileageFee: listing.excessMileageFee,
    },
    status: listing.instantBookingAvailable ? 'confirmed' : 'pending',
    paymentStatus: 'pending',
  });

  return booking;
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
    if (renterId !== userId && ownerId !== userId) {
      throw new AppError('Not authorized to cancel this booking.', 403);
    }

    if (booking.status === 'active' || booking.status === 'completed') {
      throw new AppError(
        'Cannot cancel a trip that is active or completed.',
        400,
      );
    }

    if (booking.status === 'cancelled' || booking.status === 'rejected') {
      throw new AppError(
        `Cannot cancel a booking that is already ${booking.status}.`,
        400,
      );
    }
  }

  if (booking.status === status) {
    throw new AppError(`Booking is already ${status}.`, 400);
  }

  booking.status = status;
  if (reason) booking.cancellationReason = reason;

  await booking.save();
  return booking;
};
