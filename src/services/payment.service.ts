import mongoose from 'mongoose';
import Booking from '../models/booking.model.js';
import Transaction from '../models/transaction.model.js';
import User from '../models/user.model.js';
import {
  TransactionType,
  TransactionStatus,
  PaymentProvider,
} from '../types/transaction.types.js';
import { IChapaWebhookPayload } from '../types/chapa.types.js';
import AppError from '../utils/appError.util.js';
import logger from '../config/logger.config.js';
import config from '../config/env.config.js';
import * as chapaService from '../utils/chapa.util.js';
import {
  generateTxRef,
  generatePaymentIdempotencyKey,
  generateWebhookIdempotencyKey,
  generateRefundIdempotencyKey,
} from '../utils/chapa.util.js';
import * as paymentEmailService from '../utils/paymentEmail.util.js';

export const initializePayment = async (bookingId: string, userId: string) => {
  const booking = await Booking.findById(bookingId)
    .populate('renter')
    .populate('listing');

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  const renterId = booking.renter as any;
  if (renterId._id.toString() !== userId) {
    throw new AppError('Not authorized to pay for this booking', 403);
  }

  if (booking.paymentStatus === 'paid') {
    throw new AppError('Booking already paid', 400);
  }

  if (!['pending', 'confirmed'].includes(booking.status)) {
    throw new AppError(
      `Cannot initialize payment for booking with status: ${booking.status}`,
      400,
    );
  }

  const existingTx = await Transaction.findOne({
    booking: bookingId,
    status: {
      $in: [TransactionStatus.PENDING, TransactionStatus.PROCESSING],
    },
  });

  if (existingTx) {
    logger.info(
      { bookingId, transactionId: existingTx._id },
      'Returning existing pending transaction',
    );
    return {
      transaction: existingTx,
      checkout_url: existingTx.chapaCheckoutUrl,
    };
  }

  const amount = booking.totalPrice + booking.securityDeposit;

  const breakdown = {
    rentalFee:
      booking.priceBreakdown.basePrice - booking.priceBreakdown.discountAmount,
    securityDeposit: booking.securityDeposit,
    serviceFee: booking.priceBreakdown.serviceFee,
    deliveryFee: booking.priceBreakdown.deliveryFee || 0,
    discountAmount: booking.priceBreakdown.discountAmount || 0,
  };

  const tx_ref = generateTxRef();

  const transaction = await Transaction.create({
    booking: bookingId,
    user: userId,
    type: TransactionType.PAYMENT,
    status: TransactionStatus.PENDING,
    provider: PaymentProvider.CHAPA,
    amount,
    currency: 'ETB',
    breakdown,
    chapaTxRef: tx_ref,
    idempotencyKey: generatePaymentIdempotencyKey(bookingId),
    initiatedAt: new Date(),
  });

  logger.info(
    {
      bookingId,
      transactionId: transaction._id,
      amount,
      tx_ref,
      userId,
    },
    'Transaction created, initializing Chapa payment',
  );

  const chapaResponse = await chapaService.initializePayment({
    amount,
    currency: 'ETB',
    email: renterId.email,
    first_name: renterId.firstName,
    last_name: renterId.lastName,
    tx_ref,
    callback_url: config.payment.callbackUrl,
    return_url: config.payment.returnUrl,
    customization: {
      title: 'Kech Car Rental',
      description: `Booking ${bookingId.substring(bookingId.length - 8)}`,
    },
  });

  transaction.chapaCheckoutUrl = chapaResponse.checkout_url;
  transaction.chapaResponse = chapaResponse;
  transaction.status = TransactionStatus.PROCESSING;
  await transaction.save();

  logger.info(
    {
      bookingId,
      transactionId: transaction._id,
      tx_ref,
      checkout_url: chapaResponse.checkout_url,
    },
    'Payment initialized successfully',
  );

  return {
    transaction,
    checkout_url: chapaResponse.checkout_url,
  };
};

export const verifyPayment = async (tx_ref: string, userId: string) => {
  const transaction = await Transaction.findOne({ chapaTxRef: tx_ref });

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  if (transaction.user.toString() !== userId) {
    throw new AppError('Not authorized to verify this transaction', 403);
  }

  if (transaction.status === TransactionStatus.COMPLETED) {
    logger.info(
      { tx_ref, transactionId: transaction._id },
      'Returning cached verification result',
    );

    const booking = await Booking.findById(transaction.booking);
    return {
      transaction,
      booking,
      message: 'Payment already verified',
    };
  }

  logger.info(
    { tx_ref, transactionId: transaction._id },
    'Verifying payment with Chapa',
  );

  const chapaData = await chapaService.verifyPayment(tx_ref);

  const newStatus = chapaService.mapChapaStatusToTransactionStatus(
    chapaData.status,
  );

  transaction.status = newStatus as TransactionStatus;
  transaction.chapaTransactionId = chapaData.reference;
  transaction.chapaPaymentMethod = chapaData.method;
  transaction.chapaResponse = chapaData;

  if (newStatus === 'completed') {
    transaction.completedAt = new Date();
  } else if (newStatus === 'failed' || newStatus === 'cancelled') {
    transaction.failedAt = new Date();
    transaction.lastError = `Payment ${newStatus} on Chapa`;
  }

  await transaction.save();

  const booking = await Booking.findById(transaction.booking).populate(
    'listing',
  );

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  if (newStatus === 'completed') {
    booking.paymentStatus = 'paid';
    booking.paymentTransactionId = String(transaction._id);
    await booking.save();

    logger.info(
      {
        bookingId: String(booking._id),
        transactionId: String(transaction._id),
        tx_ref,
      },
      'Booking payment status updated to paid',
    );

    await autoConfirmBookingIfApplicable(String(booking._id));

    const user = await User.findById(transaction.user);
    if (user) {
      await paymentEmailService.sendPaymentConfirmationEmail(
        transaction,
        booking,
        user,
      );
    }
  } else {
    booking.paymentStatus = 'failed';
    await booking.save();

    logger.warn(
      {
        bookingId: String(booking._id),
        transactionId: String(transaction._id),
        tx_ref,
        status: newStatus,
      },
      'Payment verification failed',
    );

    const user = await User.findById(transaction.user);
    if (user) {
      await paymentEmailService.sendPaymentFailedEmail(
        transaction,
        booking,
        user,
      );
    }
  }

  return {
    transaction,
    booking,
    message:
      newStatus === 'completed'
        ? 'Payment verified successfully'
        : 'Payment verification failed',
  };
};

export const processWebhook = async (webhookPayload: IChapaWebhookPayload) => {
  const { event, tx_ref, status, created_at, transaction_id, payment_method } =
    webhookPayload;

  logger.info({ tx_ref, event }, 'Processing Chapa webhook');

  const idempotencyKey = generateWebhookIdempotencyKey(
    tx_ref,
    event,
    new Date(created_at).getTime(),
  );

  const existingWebhook = await Transaction.findOne({
    chapaTxRef: tx_ref,
    webhookReceived: true,
    idempotencyKey,
  });

  if (existingWebhook) {
    logger.info(
      { tx_ref, idempotencyKey },
      'Webhook already processed (idempotent response)',
    );
    return existingWebhook;
  }

  const transaction = await Transaction.findOne({ chapaTxRef: tx_ref });

  if (!transaction) {
    throw new AppError(`Transaction not found: ${tx_ref}`, 404);
  }

  const updated = await Transaction.findOneAndUpdate(
    {
      _id: transaction._id,
      webhookReceived: false,
    },
    {
      $set: {
        webhookReceived: true,
        webhookPayload,
        webhookReceivedAt: new Date(),
        idempotencyKey,
        status: chapaService.mapChapaStatusToTransactionStatus(
          status,
        ) as TransactionStatus,
        chapaTransactionId: transaction_id,
        chapaPaymentMethod: payment_method,
        completedAt:
          status === 'success' ? new Date() : transaction.completedAt,
        failedAt:
          status === 'failed' || status === 'cancelled'
            ? new Date()
            : transaction.failedAt,
      },
    },
    { new: true },
  );

  if (!updated) {
    logger.warn({ tx_ref }, 'Concurrent webhook processing detected');
    return transaction;
  }

  logger.info(
    {
      tx_ref,
      transactionId: String(updated._id),
      status: status,
    },
    'Webhook processed, updating booking',
  );

  const booking = await Booking.findByIdAndUpdate(
    transaction.booking,
    {
      paymentStatus: status === 'success' ? 'paid' : 'failed',
      paymentTransactionId:
        status === 'success' ? String(updated._id) : undefined,
    },
    { new: true },
  )
    .populate('renter')
    .populate('car');

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  const user = await User.findById(transaction.user);

  if (!user) {
    logger.warn(
      { userId: transaction.user },
      'User not found for email notification',
    );
    return updated;
  }

  if (status === 'success') {
    await autoConfirmBookingIfApplicable(transaction.booking.toString());

    await paymentEmailService.sendPaymentConfirmationEmail(
      updated,
      booking,
      user,
    );
  } else {
    await paymentEmailService.sendPaymentFailedEmail(updated, booking, user);
  }

  return updated;
};

const autoConfirmBookingIfApplicable = async (bookingId: string) => {
  const booking = await Booking.findById(bookingId).populate('listing');

  if (!booking) {
    logger.warn({ bookingId }, 'Booking not found for auto-confirmation');
    return;
  }

  const listing = booking.listing as any;

  if (listing.instantBookingAvailable && booking.status === 'pending') {
    booking.status = 'confirmed';
    await booking.save();

    logger.info(
      { bookingId },
      'Booking auto-confirmed after successful payment',
    );
  }
};

export const createRefundTransaction = async (
  bookingId: string,
  refundAmount: number,
  reason: string,
) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  const paymentTransaction = await Transaction.findOne({
    booking: bookingId,
    type: TransactionType.PAYMENT,
    status: TransactionStatus.COMPLETED,
  });

  if (!paymentTransaction) {
    throw new AppError('No completed payment found for this booking', 400);
  }

  const refundTransaction = await Transaction.create({
    booking: bookingId,
    user: booking.renter,
    type: TransactionType.REFUND,
    status: TransactionStatus.REFUND_PENDING,
    provider: PaymentProvider.CHAPA,
    amount: refundAmount,
    currency: 'ETB',
    idempotencyKey: generateRefundIdempotencyKey(bookingId),
    chapaResponse: {
      originalTransactionId: paymentTransaction.chapaTransactionId,
      originalTxRef: paymentTransaction.chapaTxRef,
      reason,
    },
    initiatedAt: new Date(),
  });

  logger.info(
    {
      bookingId,
      refundAmount,
      transactionId: refundTransaction._id,
      originalTransactionId: paymentTransaction._id,
    },
    'Refund transaction created (manual processing required)',
  );

  const user = await User.findById(booking.renter);
  if (user) {
    await paymentEmailService.sendRefundInitiatedEmail(
      refundTransaction,
      booking,
      user,
    );
  }

  await paymentEmailService.sendAdminRefundNotification(
    refundTransaction,
    booking,
    user!,
  );

  return refundTransaction;
};

export const getTransactionsByBooking = async (
  bookingId: string,
  userId: string,
) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  const renterId = (booking.renter as mongoose.Types.ObjectId).toString();
  const ownerId = (booking.owner as mongoose.Types.ObjectId).toString();

  if (renterId !== userId && ownerId !== userId) {
    throw new AppError('Not authorized to view these transactions', 403);
  }

  const transactions = await Transaction.find({ booking: bookingId })
    .sort({ createdAt: -1 })
    .select('-chapaResponse -webhookPayload');

  return transactions;
};

export const getTransactionById = async (
  transactionId: string,
  userId: string,
) => {
  const transaction = await Transaction.findById(transactionId).populate({
    path: 'booking',
    select: 'renter owner',
  });

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  const booking = transaction.booking as any;
  const renterId = booking.renter.toString();
  const ownerId = booking.owner.toString();

  if (renterId !== userId && ownerId !== userId) {
    throw new AppError('Not authorized to view this transaction', 403);
  }

  return transaction;
};

export const getTransactionForAdmin = async (transactionId: string) => {
  const transaction = await Transaction.findById(transactionId).populate({
    path: 'booking',
    select: 'renter owner status paymentStatus',
  });

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  return transaction;
};

export const getAllTransactions = async (filters?: {
  status?: string;
  type?: string;
  limit?: number;
  skip?: number;
}) => {
  const query: any = {};

  if (filters?.status) {
    query.status = filters.status;
  }

  if (filters?.type) {
    query.type = filters.type;
  }

  const transactions = await Transaction.find(query)
    .populate('user', 'firstName lastName email')
    .populate('booking', '_id status paymentStatus')
    .sort({ createdAt: -1 })
    .limit(filters?.limit || 50)
    .skip(filters?.skip || 0);

  const total = await Transaction.countDocuments(query);

  return {
    transactions,
    total,
  };
};

export const completeRefund = async (transactionId: string) => {
  const transaction = await Transaction.findById(transactionId);

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  if (transaction.type !== TransactionType.REFUND) {
    throw new AppError('This transaction is not a refund', 400);
  }

  if (transaction.status === TransactionStatus.REFUNDED) {
    throw new AppError('Refund already completed', 400);
  }

  transaction.status = TransactionStatus.REFUNDED;
  transaction.completedAt = new Date();
  await transaction.save();

  logger.info(
    {
      transactionId: transaction._id,
      bookingId: transaction.booking,
      amount: transaction.amount,
    },
    'Refund marked as completed',
  );

  const booking = await Booking.findById(transaction.booking).populate(
    'renter',
  );
  const user = await User.findById(transaction.user);

  if (booking && user) {
    await paymentEmailService.sendRefundCompletedEmail(
      transaction,
      booking,
      user,
    );
  }

  return transaction;
};
