import mongoose from 'mongoose';
import SaleReservation from '../models/saleReservation.model.js';
import SaleListing from '../models/saleListing.model.js';
import Car from '../models/car.model.js';
import User from '../models/user.model.js';
import AppError from '../utils/appError.util.js';
import logger from '../config/logger.config.js';
import * as paymentService from './payment.service.js';
import * as saleEmailService from './saleEmail.service.js';
import {
  CreateSaleReservationInput,
  CancelSaleReservationInput,
  ConfirmSaleReservationInput,
  ScheduleInspectionInput,
  GetSaleReservationsQuery,
  CompleteSaleInput,
} from '../validation/sale.validation.js';

/**
 * Calculate reservation fee based on sale price
 * Formula: 1% of sale price, minimum 5,000 ETB, maximum 50,000 ETB
 */
export const calculateReservationFee = (salePrice: number): number => {
  const percentageFee = salePrice * 0.01; // 1% of sale price
  const minimumFee = 5000; // 5,000 ETB minimum
  const maximumFee = 50000; // 50,000 ETB maximum

  // Round to nearest 100 ETB for cleaner amounts
  const calculatedFee = Math.max(minimumFee, Math.min(percentageFee, maximumFee));
  return Math.round(calculatedFee / 100) * 100;
};

/**
 * Calculate platform service fee (2% of sale price)
 */
export const calculatePlatformServiceFee = (salePrice: number): number => {
  return Math.round(salePrice * 0.02 * 100) / 100;
};

/**
 * Calculate refund amount based on time elapsed since reservation
 * - < 48h: 95% refund
 * - 48-72h: 50% refund
 * - > 72h: 0% refund
 */
export const calculateRefundAmount = (
  reservationFee: number,
  reservedAt: Date,
  cancellationReason?: string,
): { refundAmount: number; platformFee: number } => {
  const now = new Date();
  const hoursElapsed = (now.getTime() - reservedAt.getTime()) / (1000 * 60 * 60);

  let refundPercentage = 0;

  if (hoursElapsed < 48) {
    refundPercentage = 0.95; // 95% refund
  } else if (hoursElapsed < 72) {
    refundPercentage = 0.5; // 50% refund
  } else {
    refundPercentage = 0; // No refund
  }

  const refundAmount = Math.round(reservationFee * refundPercentage * 100) / 100;
  const platformFee = reservationFee - refundAmount;

  logger.info(
    {
      reservationFee,
      hoursElapsed: Math.round(hoursElapsed * 10) / 10,
      refundPercentage: refundPercentage * 100 + '%',
      refundAmount,
      platformFee,
    },
    'Calculated refund amount',
  );

  return { refundAmount, platformFee };
};

/**
 * Create a new sale reservation
 * This initiates the reservation process but payment happens separately
 */
export const createReservation = async (
  userId: string,
  input: CreateSaleReservationInput,
) => {
  const { listingId } = input;

  // Fetch listing with car and owner details
  const listing = await SaleListing.findById(listingId)
    .populate('car')
    .populate('owner');

  if (!listing) {
    throw new AppError('Sale listing not found', 404);
  }

  // Check if listing is available
  if (listing.status !== 'available') {
    throw new AppError(
      `This car is not available for reservation. Current status: ${listing.status}`,
      400,
    );
  }

  // Check if user is trying to buy their own car
  const ownerId =
    listing.owner instanceof mongoose.Types.ObjectId
      ? listing.owner.toString()
      : (listing.owner as any)._id.toString();

  if (ownerId === userId) {
    throw new AppError('You cannot reserve your own car', 400);
  }

  // Check for existing active reservations by this user on this listing
  const existingReservation = await SaleReservation.findOne({
    listing: listingId,
    buyer: userId,
    status: { $in: ['pending', 'confirmed'] },
  });

  if (existingReservation) {
    throw new AppError(
      'You already have an active reservation for this car',
      400,
    );
  }

  // Calculate fees
  const salePrice = listing.salePrice;
  const reservationFee = calculateReservationFee(salePrice);
  const platformServiceFee = calculatePlatformServiceFee(salePrice);
  const finalSettlementAmount = salePrice - reservationFee;

  // Create reservation
  const reservation = await SaleReservation.create({
    listing: listingId,
    car: listing.car,
    buyer: userId,
    seller: ownerId,
    salePrice,
    reservationFee,
    platformServiceFee,
    finalSettlementAmount,
    status: 'pending',
    paymentStatus: 'pending',
    reservedAt: new Date(),
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
    inspectionScheduled: false,
  });

  logger.info(
    {
      reservationId: reservation._id,
      listingId,
      buyerId: userId,
      sellerId: ownerId,
      salePrice,
      reservationFee,
    },
    'Sale reservation created',
  );

  // Populate references before returning
  await reservation.populate([
    { path: 'listing' },
    { path: 'car' },
    { path: 'buyer', select: 'firstName lastName email phoneNumber' },
    { path: 'seller', select: 'firstName lastName email phoneNumber' },
  ]);

  // Send confirmation emails (async, don't wait)
  setImmediate(async () => {
    try {
      await saleEmailService.sendReservationConfirmationEmails(reservation);
    } catch (error: any) {
      logger.error(
        { reservationId: reservation._id, error: error.message },
        'Failed to send reservation confirmation emails',
      );
    }
  });

  return reservation;
};

/**
 * Get reservation by ID with authorization check
 */
export const getReservationById = async (
  reservationId: string,
  userId: string,
  userRole?: string,
) => {
  const reservation = await SaleReservation.findById(reservationId)
    .populate('listing')
    .populate({
      path: 'car',
      populate: [
        { path: 'make' },
        { path: 'vehicleModel' },
        { path: 'homeLocation.city' },
      ],
    })
    .populate('buyer', 'firstName lastName email phoneNumber profileImage')
    .populate('seller', 'firstName lastName email phoneNumber profileImage')
    .populate('agentAssigned', 'firstName lastName email phoneNumber');

  if (!reservation) {
    throw new AppError('Reservation not found', 404);
  }

  // Authorization: buyer, seller, or admin can view
  const buyerId = (reservation.buyer as any)?._id?.toString();
  const sellerId = (reservation.seller as any)?._id?.toString();
  const isAuthorized =
    userId === buyerId ||
    userId === sellerId ||
    userRole === 'admin' ||
    userRole === 'super_admin';

  if (!isAuthorized) {
    throw new AppError('Not authorized to view this reservation', 403);
  }

  return reservation;
};

/**
 * Get buyer's reservations (my reservations)
 */
export const getMyReservations = async (
  userId: string,
  query: GetSaleReservationsQuery,
) => {
  const { status, page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;

  const filter: any = { buyer: userId };
  if (status) {
    filter.status = status;
  }

  const [reservations, total] = await Promise.all([
    SaleReservation.find(filter)
      .populate('listing')
      .populate({
        path: 'car',
        populate: [
          { path: 'make' },
          { path: 'vehicleModel' },
          { path: 'homeLocation.city' },
        ],
      })
      .populate('seller', 'firstName lastName email phoneNumber profileImage')
      .populate('agentAssigned', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SaleReservation.countDocuments(filter),
  ]);

  return {
    reservations,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get seller's reservations (reservations for my listings)
 */
export const getSellerReservations = async (
  userId: string,
  query: GetSaleReservationsQuery,
) => {
  const { status, page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;

  const filter: any = { seller: userId };
  if (status) {
    filter.status = status;
  }

  const [reservations, total] = await Promise.all([
    SaleReservation.find(filter)
      .populate('listing')
      .populate({
        path: 'car',
        populate: [
          { path: 'make' },
          { path: 'vehicleModel' },
          { path: 'homeLocation.city' },
        ],
      })
      .populate('buyer', 'firstName lastName email phoneNumber profileImage')
      .populate('agentAssigned', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SaleReservation.countDocuments(filter),
  ]);

  return {
    reservations,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Cancel reservation (buyer-initiated)
 * Calculates refund based on timing
 */
export const cancelReservation = async (
  reservationId: string,
  userId: string,
  input: CancelSaleReservationInput,
) => {
  const reservation = await SaleReservation.findById(reservationId)
    .populate('listing')
    .populate('buyer', 'firstName lastName email')
    .populate('seller', 'firstName lastName email');

  if (!reservation) {
    throw new AppError('Reservation not found', 404);
  }

  // Authorization: only buyer can cancel
  const buyerId = (reservation.buyer as any)?._id?.toString();
  if (userId !== buyerId) {
    throw new AppError('Only the buyer can cancel this reservation', 403);
  }

  // Check if reservation can be cancelled
  if (!['pending', 'confirmed'].includes(reservation.status)) {
    throw new AppError(
      `Cannot cancel reservation with status: ${reservation.status}`,
      400,
    );
  }

  // Calculate refund
  const { refundAmount, platformFee } = calculateRefundAmount(
    reservation.reservationFee,
    reservation.reservedAt,
    input.reason,
  );

  // Update reservation
  reservation.status = 'cancelled';
  reservation.cancelledAt = new Date();
  reservation.cancelledBy = 'buyer';
  reservation.cancellationReason = input.reason;
  reservation.refundAmount = refundAmount;
  reservation.refundStatus = refundAmount > 0 ? 'pending' : undefined;

  await reservation.save();

  // Process refund if applicable
  if (refundAmount > 0 && reservation.paymentStatus === 'paid') {
    try {
      await paymentService.processSaleRefund(
        reservationId,
        refundAmount,
        input.reason,
      );
    } catch (error: any) {
      logger.error(
        {
          reservationId,
          error: error.message,
        },
        'Failed to process refund, but reservation was cancelled',
      );
      // Don't throw - reservation is already cancelled
    }
  }

  // Update listing back to available
  await SaleListing.findByIdAndUpdate(reservation.listing, {
    status: 'available',
    reservedBy: null,
    reservedAt: null,
    reservationExpiresAt: null,
  });

  logger.info(
    {
      reservationId: reservation._id,
      buyerId: userId,
      reason: input.reason,
      refundAmount,
      platformFee,
    },
    'Reservation cancelled by buyer',
  );

  // Send cancellation notifications (async, don't wait)
  setImmediate(async () => {
    try {
      await saleEmailService.sendCancellationNotifications(
        reservation.buyer as any,
        reservation.seller as any,
        reservation.car as any,
        reservation as any,
        'buyer',
        0, // Seller receives nothing on buyer cancellation
        platformFee,
      );
    } catch (error: any) {
      logger.error(
        { reservationId, error: error.message },
        'Failed to send buyer cancellation emails',
      );
    }
  });

  return {
    reservation,
    refund: {
      amount: refundAmount,
      status: refundAmount > 0 ? 'pending' : 'none',
      platformFee,
    },
  };
};

/**
 * Seller cancels reservation
 * Buyer gets full refund + 10% penalty from seller
 */
export const sellerCancelReservation = async (
  reservationId: string,
  userId: string,
  reason: string,
) => {
  const reservation = await SaleReservation.findById(reservationId)
    .populate('listing')
    .populate('buyer', 'firstName lastName email')
    .populate('seller', 'firstName lastName email');

  if (!reservation) {
    throw new AppError('Reservation not found', 404);
  }

  // Authorization: only seller can cancel
  const sellerId = (reservation.seller as any)?._id?.toString();
  if (userId !== sellerId) {
    throw new AppError('Only the seller can cancel this reservation', 403);
  }

  // Check if reservation can be cancelled
  if (!['pending', 'confirmed'].includes(reservation.status)) {
    throw new AppError(
      `Cannot cancel reservation with status: ${reservation.status}`,
      400,
    );
  }

  // Seller cancellation: buyer gets 110% refund (100% + 10% penalty)
  const refundAmount = Math.round(reservation.reservationFee * 1.1 * 100) / 100;

  // Update reservation
  reservation.status = 'cancelled';
  reservation.cancelledAt = new Date();
  reservation.cancelledBy = 'seller';
  reservation.cancellationReason = reason;
  reservation.refundAmount = refundAmount;
  reservation.refundStatus = 'pending';

  await reservation.save();

  // Process refund (110% to buyer)
  if (reservation.paymentStatus === 'paid') {
    try {
      await paymentService.processSaleRefund(
        reservationId,
        refundAmount,
        `Seller cancellation: ${reason}`,
      );
    } catch (error: any) {
      logger.error(
        {
          reservationId,
          error: error.message,
        },
        'Failed to process seller cancellation refund',
      );
      // Don't throw - reservation is already cancelled
    }
  }

  // Update listing back to available
  await SaleListing.findByIdAndUpdate(reservation.listing, {
    status: 'available',
    reservedBy: null,
    reservedAt: null,
    reservationExpiresAt: null,
  });

  logger.warn(
    {
      reservationId: reservation._id,
      sellerId: userId,
      reason,
      refundAmount,
      penalty: refundAmount - reservation.reservationFee,
    },
    'Reservation cancelled by seller - buyer receives 110% refund',
  );

  // Send cancellation notifications (async, don't wait)
  setImmediate(async () => {
    try {
      await saleEmailService.sendCancellationNotifications(
        reservation.buyer as any,
        reservation.seller as any,
        reservation.car as any,
        reservation as any,
        'seller',
        reservation.reservationFee, // Seller keeps the reservation fee
        refundAmount - reservation.reservationFee, // Platform gets the penalty
      );
    } catch (error: any) {
      logger.error(
        { reservationId, error: error.message },
        'Failed to send seller cancellation emails',
      );
    }
  });

  return {
    reservation,
    refund: {
      amount: refundAmount,
      status: 'pending',
      penalty: refundAmount - reservation.reservationFee,
    },
  };
};

/**
 * Confirm reservation after inspection (buyer confirms they want to proceed)
 */
export const confirmReservation = async (
  reservationId: string,
  userId: string,
  input: ConfirmSaleReservationInput,
) => {
  const reservation = await SaleReservation.findById(reservationId);

  if (!reservation) {
    throw new AppError('Reservation not found', 404);
  }

  // Authorization: only buyer can confirm
  const buyerId = (reservation.buyer as mongoose.Types.ObjectId).toString();
  if (userId !== buyerId) {
    throw new AppError('Only the buyer can confirm this reservation', 403);
  }

  // Check if reservation is in pending status
  if (reservation.status !== 'pending') {
    throw new AppError(
      `Cannot confirm reservation with status: ${reservation.status}`,
      400,
    );
  }

  // Check if payment was made
  if (reservation.paymentStatus !== 'paid') {
    throw new AppError(
      'Payment must be completed before confirming reservation',
      400,
    );
  }

  // Update reservation
  reservation.status = 'confirmed';
  reservation.confirmedAt = new Date();

  if (input.inspectionNotes) {
    reservation.inspectionNotes = input.inspectionNotes;
  }

  if (input.agreedSettlementMethod) {
    reservation.settlementMethod = input.agreedSettlementMethod;
  }

  await reservation.save();

  logger.info(
    {
      reservationId: reservation._id,
      buyerId: userId,
    },
    'Reservation confirmed by buyer after inspection',
  );

  await reservation.populate([
    { path: 'listing' },
    { path: 'car' },
    { path: 'buyer', select: 'firstName lastName email phoneNumber' },
    { path: 'seller', select: 'firstName lastName email phoneNumber' },
  ]);

  return reservation;
};

/**
 * Schedule inspection (seller schedules meeting with buyer)
 */
export const scheduleInspection = async (
  reservationId: string,
  userId: string,
  input: ScheduleInspectionInput,
) => {
  const reservation = await SaleReservation.findById(reservationId);

  if (!reservation) {
    throw new AppError('Reservation not found', 404);
  }

  // Authorization: seller or admin can schedule
  const sellerId = (reservation.seller as mongoose.Types.ObjectId).toString();
  if (userId !== sellerId) {
    throw new AppError(
      'Only the seller can schedule inspection for this reservation',
      403,
    );
  }

  // Check if reservation is active
  if (!['pending', 'confirmed'].includes(reservation.status)) {
    throw new AppError(
      `Cannot schedule inspection for reservation with status: ${reservation.status}`,
      400,
    );
  }

  // Check if payment was made
  if (reservation.paymentStatus !== 'paid') {
    throw new AppError(
      'Payment must be completed before scheduling inspection',
      400,
    );
  }

  // Update reservation
  reservation.inspectionScheduled = true;
  reservation.inspectionDate = input.inspectionDate;
  reservation.inspectionLocation = input.inspectionLocation;

  if (input.notes) {
    reservation.inspectionNotes = input.notes;
  }

  await reservation.save();

  logger.info(
    {
      reservationId: reservation._id,
      sellerId: userId,
      inspectionDate: input.inspectionDate,
    },
    'Inspection scheduled',
  );

  await reservation.populate([
    { path: 'listing' },
    { path: 'car' },
    { path: 'buyer', select: 'firstName lastName email phoneNumber' },
    { path: 'seller', select: 'firstName lastName email phoneNumber' },
  ]);

  // Send inspection scheduled notifications (async, don't wait)
  setImmediate(async () => {
    try {
      await saleEmailService.sendInspectionScheduledToBoth(
        reservation.buyer as any,
        reservation.seller as any,
        reservation.car as any,
        reservation as any,
      );
    } catch (error: any) {
      logger.error(
        { reservationId: reservation._id, error: error.message },
        'Failed to send inspection scheduled emails',
      );
    }
  });

  return reservation;
};

/**
 * Check and auto-expire reservations that have passed their expiration time
 * This should be run periodically (cron job)
 */
export const checkAndExpireReservations = async () => {
  const now = new Date();

  // Find all pending reservations that have expired
  const expiredReservations = await SaleReservation.find({
    status: 'pending',
    expiresAt: { $lt: now },
    paymentStatus: 'paid', // Only auto-expire if payment was made
  });

  logger.info(
    { count: expiredReservations.length },
    'Found expired reservations to process',
  );

  for (const reservation of expiredReservations) {
    try {
      // Calculate 80% refund for auto-expiration
      const refundAmount = Math.round(reservation.reservationFee * 0.8 * 100) / 100;
      const platformFee = reservation.reservationFee - refundAmount;

      // Update reservation
      reservation.status = 'expired';
      reservation.cancelledAt = new Date();
      reservation.cancelledBy = 'system';
      reservation.cancellationReason = 'Reservation expired after 48 hours';
      reservation.refundAmount = refundAmount;
      reservation.refundStatus = 'pending';
      await reservation.save();

      // Send expiry notification to seller (async, don't wait)
      setImmediate(async () => {
        try {
          await saleEmailService.sendReservationExpiredEmail(
            reservation.seller as any,
            reservation.buyer as any,
            reservation.car as any,
            reservation,
          );
        } catch (error: any) {
          logger.error(
            { reservationId: reservation._id, error: error.message },
            'Failed to send reservation expired email to seller',
          );
        }
      });

      // Process refund if payment was made
      if (reservation.paymentStatus === 'paid' && refundAmount > 0) {
        try {
          await paymentService.processSaleRefund(
            String(reservation._id),
            refundAmount,
            'Reservation expired after 48 hours',
          );
        } catch (error: any) {
          logger.error(
            {
              reservationId: reservation._id,
              error: error.message,
            },
            'Failed to process refund for expired reservation',
          );
          // Continue - reservation is already expired
        }
      }

      // Update listing back to available
      await SaleListing.findByIdAndUpdate(reservation.listing, {
        status: 'available',
        reservedBy: null,
        reservedAt: null,
        reservationExpiresAt: null,
      });

      logger.info(
        {
          reservationId: reservation._id,
          refundAmount,
          platformFee,
        },
        'Reservation auto-expired',
      );
    } catch (error: any) {
      logger.error(
        {
          reservationId: reservation._id,
          error: error.message,
        },
        'Failed to expire reservation',
      );
    }
  }

  return expiredReservations.length;
};

// ==================== ADMIN FUNCTIONS ====================

/**
 * Get all sale reservations for admin view
 */
export const getAllSaleReservationsAdmin = async (query: GetSaleReservationsQuery) => {
  const { status, paymentStatus, page = 1, limit = 20, buyerId, sellerId } = query;
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (buyerId) filter.buyer = buyerId;
  if (sellerId) filter.seller = sellerId;

  const [reservations, total] = await Promise.all([
    SaleReservation.find(filter)
      .populate('buyer', 'firstName lastName email phoneNumber')
      .populate('seller', 'firstName lastName email phoneNumber')
      .populate({
        path: 'car',
        populate: [{ path: 'make' }, { path: 'vehicleModel' }],
      })
      .populate('listing')
      .populate('agentAssigned', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SaleReservation.countDocuments(filter),
  ]);

  return {
    reservations,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Extend reservation expiry time (admin only)
 */
export const extendReservationExpiry = async (
  reservationId: string,
  extensionHours: number,
  reason: string,
  adminId: string,
) => {
  const reservation = await SaleReservation.findById(reservationId);

  if (!reservation) {
    throw new AppError('Reservation not found', 404);
  }

  // Only extend if reservation is active (not completed, cancelled, or expired)
  if (!['pending', 'confirmed'].includes(reservation.status)) {
    throw new AppError(
      `Cannot extend reservation with status: ${reservation.status}`,
      400,
    );
  }

  // Calculate new expiry time
  const currentExpiry = reservation.expiresAt;
  const newExpiry = new Date(currentExpiry.getTime() + extensionHours * 60 * 60 * 1000);

  // Update reservation
  reservation.expiresAt = newExpiry;
  await reservation.save();

  logger.info(
    {
      reservationId,
      adminId,
      oldExpiry: currentExpiry,
      newExpiry,
      extensionHours,
      reason,
    },
    'Reservation expiry extended by admin',
  );

  await reservation.populate([
    { path: 'buyer', select: 'firstName lastName email' },
    { path: 'seller', select: 'firstName lastName email' },
    { path: 'car' },
  ]);

  return reservation;
};

/**
 * Complete sale reservation (admin override)
 */
export const completeSaleReservationAdmin = async (
  reservationId: string,
  completionData: CompleteSaleInput,
  adminId: string,
) => {
  const reservation = await SaleReservation.findById(reservationId)
    .populate('listing');

  if (!reservation) {
    throw new AppError('Reservation not found', 404);
  }

  // Check if reservation can be completed
  if (reservation.status !== 'confirmed') {
    throw new AppError(
      `Cannot complete reservation with status: ${reservation.status}. Must be confirmed first.`,
      400,
    );
  }

  // Update reservation
  reservation.status = 'completed';
  reservation.completedAt = new Date();
  reservation.settlementMethod = completionData.settlementMethod;
  reservation.settlementReference = completionData.settlementReference;
  reservation.transportAuthorityTransferDate = completionData.transportAuthorityTransferDate;

  await reservation.save();

  // Update listing to sold
  await SaleListing.findByIdAndUpdate(reservation.listing, {
    status: 'sold',
    soldAt: new Date(),
  });

  logger.info(
    {
      reservationId,
      adminId,
      settlementMethod: completionData.settlementMethod,
      settlementReference: completionData.settlementReference,
    },
    'Reservation completed by admin',
  );

  await reservation.populate([
    { path: 'buyer', select: 'firstName lastName email' },
    { path: 'seller', select: 'firstName lastName email' },
    { path: 'car' },
    { path: 'listing' },
  ]);

  return {
    reservation,
    settlementDetails: completionData,
  };
};

/**
 * Cancel reservation (admin override)
 */
export const cancelReservationAdmin = async (
  reservationId: string,
  reason: string,
  processRefund: boolean,
  adminId: string,
) => {
  const reservation = await SaleReservation.findById(reservationId)
    .populate('buyer', 'firstName lastName email')
    .populate('seller', 'firstName lastName email')
    .populate('car');

  if (!reservation) {
    throw new AppError('Reservation not found', 404);
  }

  // Check if reservation can be cancelled
  if (['completed', 'cancelled'].includes(reservation.status)) {
    throw new AppError(
      `Cannot cancel reservation with status: ${reservation.status}`,
      400,
    );
  }

  // Update reservation
  reservation.status = 'cancelled';
  reservation.cancelledAt = new Date();
  reservation.cancelledBy = 'admin';
  reservation.cancellationReason = reason;

  // Process refund if requested and payment was made
  let refundResult = null;
  if (processRefund && reservation.paymentStatus === 'paid') {
    try {
      // For admin cancellations, provide full refund
      refundResult = await paymentService.processSaleRefund(
        reservationId,
        reservation.reservationFee,
        `Admin cancellation: ${reason}`,
      );
      reservation.refundAmount = reservation.reservationFee;
      reservation.refundStatus = 'processed';
      reservation.refundTransaction = refundResult._id as any;
    } catch (error: any) {
      logger.error(
        { reservationId, error: error.message },
        'Failed to process refund during admin cancellation',
      );
      // Still cancel the reservation even if refund fails
    }
  }

  await reservation.save();

  // Update listing back to available
  await SaleListing.findByIdAndUpdate(reservation.listing, {
    status: 'available',
    reservedBy: null,
    reservedAt: null,
    reservationExpiresAt: null,
  });

  logger.warn(
    {
      reservationId,
      adminId,
      reason,
      processRefund,
      refundProcessed: !!refundResult,
    },
    'Reservation cancelled by admin',
  );

  return {
    reservation,
    refundProcessed: !!refundResult,
    refundTransaction: refundResult,
  };
};

/**
 * Assign agent to reservation
 */
export const assignAgentToReservation = async (
  reservationId: string,
  agentId: string,
  notes: string,
  adminId: string,
) => {
  const reservation = await SaleReservation.findById(reservationId);

  if (!reservation) {
    throw new AppError('Reservation not found', 404);
  }

  // Check if agent exists and is active
  const agent = await User.findById(agentId);
  if (!agent) {
    throw new AppError('Agent not found', 404);
  }

  if (agent.status !== 'approved') {
    throw new AppError('Agent is not approved', 400);
  }

  // Update reservation
  reservation.agentAssigned = agentId as any;
  if (notes) {
    reservation.inspectionNotes = notes;
  }

  await reservation.save();

  logger.info(
    {
      reservationId,
      agentId,
      adminId,
      notes,
    },
    'Agent assigned to reservation',
  );

  await reservation.populate([
    { path: 'buyer', select: 'firstName lastName email' },
    { path: 'seller', select: 'firstName lastName email' },
    { path: 'agentAssigned', select: 'firstName lastName email' },
    { path: 'car' },
  ]);

  return reservation;
};

/**
 * Get sale reservations analytics
 */
export const getSaleReservationsAnalytics = async (filters: {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
}) => {
  const { startDate, endDate, groupBy = 'month' } = filters;

  // Build date filter
  const dateFilter: any = {};
  if (startDate) {
    dateFilter.$gte = new Date(startDate);
  }
  if (endDate) {
    dateFilter.$lte = new Date(endDate);
  }

  // Get overall metrics
  const [totalReservations, completedReservations, cancelledReservations, totalRevenue] = await Promise.all([
    SaleReservation.countDocuments(dateFilter.createdAt ? { createdAt: dateFilter } : {}),
    SaleReservation.countDocuments({
      ...dateFilter.createdAt ? { createdAt: dateFilter } : {},
      status: 'completed',
    }),
    SaleReservation.countDocuments({
      ...dateFilter.createdAt ? { createdAt: dateFilter } : {},
      status: 'cancelled',
    }),
    SaleReservation.aggregate([
      {
        $match: {
          ...dateFilter.createdAt ? { createdAt: dateFilter } : {},
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$salePrice' },
          totalFees: { $sum: '$platformServiceFee' },
          totalReservations: { $sum: 1 },
        },
      },
    ]),
  ]);

  // Calculate conversion rate
  const conversionRate = totalReservations > 0 ? (completedReservations / totalReservations) * 100 : 0;

  // Get status distribution
  const statusDistribution = await SaleReservation.aggregate([
    {
      $match: dateFilter.createdAt ? { createdAt: dateFilter } : {},
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  // Get revenue by time period
  const revenueByPeriod = await SaleReservation.aggregate([
    {
      $match: {
        ...dateFilter.createdAt ? { createdAt: dateFilter } : {},
        status: 'completed',
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: groupBy === 'month' ? '%Y-%m' : groupBy === 'week' ? '%Y-%U' : '%Y-%m-%d',
            date: '$createdAt',
          },
        },
        revenue: { $sum: '$salePrice' },
        fees: { $sum: '$platformServiceFee' },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id': 1 },
    },
  ]);

  const revenueData = totalRevenue[0] || { totalRevenue: 0, totalFees: 0, totalReservations: 0 };

  return {
    summary: {
      totalReservations,
      completedReservations,
      cancelledReservations,
      conversionRate: Math.round(conversionRate * 100) / 100,
      totalRevenue: revenueData.totalRevenue || 0,
      totalPlatformFees: revenueData.totalFees || 0,
      netRevenue: (revenueData.totalRevenue || 0) - (revenueData.totalFees || 0),
    },
    statusDistribution: statusDistribution.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    revenueByPeriod,
    dateRange: {
      startDate: startDate || null,
      endDate: endDate || null,
      groupBy,
    },
  };
};

/**
 * Helper function to mark reservation as paid after successful payment
 * Called by payment service after payment verification
 */
export const markReservationAsPaid = async (
  reservationId: string,
  transactionId: mongoose.Types.ObjectId,
  paymentMethod: string,
) => {
  const reservation = await SaleReservation.findById(reservationId);

  if (!reservation) {
    throw new AppError('Reservation not found', 404);
  }

  if (reservation.paymentStatus === 'paid') {
    logger.warn(
      { reservationId },
      'Reservation already marked as paid',
    );
    return reservation;
  }

  reservation.paymentStatus = 'paid';
  reservation.paymentTransaction = transactionId;
  reservation.paymentMethod = paymentMethod;
  await reservation.save();

  // Update listing status to reserved
  await SaleListing.findByIdAndUpdate(reservation.listing, {
    status: 'reserved',
    reservedBy: reservation.buyer,
    reservedAt: reservation.reservedAt,
    reservationExpiresAt: reservation.expiresAt,
  });

  logger.info(
    {
      reservationId: String(reservation._id),
      transactionId: String(transactionId),
      listingId: String(reservation.listing),
    },
    'Reservation marked as paid and listing updated to reserved',
  );

  return reservation;
};

