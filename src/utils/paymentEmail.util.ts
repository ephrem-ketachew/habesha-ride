import { sendEmail } from '../utils/email.util.js';
import logger from '../config/logger.config.js';
import {
  paymentConfirmationTemplate,
  paymentFailedTemplate,
  refundInitiatedTemplate,
  refundCompletedTemplate,
  paymentReminderTemplate,
} from '../templates/paymentEmail.templates.js';
import { ITransactionDocument } from '../types/transaction.types.js';
import { IBookingDocument } from '../types/booking.types.js';
import { IUserDocument } from '../types/user.types.js';

export const sendPaymentConfirmationEmail = async (
  transaction: ITransactionDocument,
  booking: IBookingDocument,
  user: IUserDocument,
) => {
  try {
    const listing = booking.listing as any;
    const car = booking.car as any;

    const emailContent = paymentConfirmationTemplate({
      userName: `${user.firstName} ${user.lastName}`,
      bookingId: String(booking._id),
      amount: transaction.amount,
      breakdown: transaction.breakdown,
      transactionRef: transaction.chapaTxRef || String(transaction._id),
      paymentDate: transaction.completedAt || new Date(),
      bookingStartDate: booking.startDate,
      bookingEndDate: booking.endDate,
      carName: car?.make && car?.model ? `${car.make} ${car.model}` : undefined,
    });

    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });

    logger.info(
      {
        userId: user._id,
        bookingId: booking._id,
        transactionId: transaction._id,
      },
      'Payment confirmation email sent successfully',
    );
  } catch (error: any) {
    logger.error(
      {
        error: error.message,
        userId: user._id,
        bookingId: booking._id,
      },
      'Failed to send payment confirmation email',
    );
  }
};

export const sendPaymentFailedEmail = async (
  transaction: ITransactionDocument,
  booking: IBookingDocument,
  user: IUserDocument,
) => {
  try {
    const emailContent = paymentFailedTemplate({
      userName: `${user.firstName} ${user.lastName}`,
      bookingId: String(booking._id),
      amount: transaction.amount,
      transactionRef: transaction.chapaTxRef || String(transaction._id),
      failureReason: transaction.lastError,
    });

    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });

    logger.info(
      {
        userId: user._id,
        bookingId: booking._id,
        transactionId: transaction._id,
      },
      'Payment failed email sent successfully',
    );
  } catch (error: any) {
    logger.error(
      {
        error: error.message,
        userId: user._id,
        bookingId: booking._id,
      },
      'Failed to send payment failed email',
    );
  }
};

export const sendRefundInitiatedEmail = async (
  transaction: ITransactionDocument,
  booking: IBookingDocument,
  user: IUserDocument,
) => {
  try {
    const emailContent = refundInitiatedTemplate({
      userName: `${user.firstName} ${user.lastName}`,
      bookingId: String(booking._id),
      refundAmount: transaction.amount,
      transactionRef: transaction.chapaTxRef || String(transaction._id),
      reason: booking.cancellationReason || 'Booking cancelled',
      estimatedDays: 5,
    });

    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });

    logger.info(
      {
        userId: user._id,
        bookingId: booking._id,
        transactionId: transaction._id,
      },
      'Refund initiated email sent successfully',
    );
  } catch (error: any) {
    logger.error(
      {
        error: error.message,
        userId: user._id,
        bookingId: booking._id,
      },
      'Failed to send refund initiated email',
    );
  }
};

export const sendRefundCompletedEmail = async (
  transaction: ITransactionDocument,
  booking: IBookingDocument,
  user: IUserDocument,
) => {
  try {
    const emailContent = refundCompletedTemplate({
      userName: `${user.firstName} ${user.lastName}`,
      bookingId: String(booking._id),
      refundAmount: transaction.amount,
      transactionRef: transaction.chapaTxRef || String(transaction._id),
      completedDate: transaction.completedAt || new Date(),
    });

    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });

    logger.info(
      {
        userId: user._id,
        bookingId: booking._id,
        transactionId: transaction._id,
      },
      'Refund completed email sent successfully',
    );
  } catch (error: any) {
    logger.error(
      {
        error: error.message,
        userId: user._id,
        bookingId: booking._id,
      },
      'Failed to send refund completed email',
    );
  }
};

export const sendPaymentReminderEmail = async (
  booking: IBookingDocument,
  user: IUserDocument,
  expiresAt?: Date,
) => {
  try {
    const car = booking.car as any;

    const emailContent = paymentReminderTemplate({
      userName: `${user.firstName} ${user.lastName}`,
      bookingId: String(booking._id),
      amount: booking.totalPrice + booking.securityDeposit,
      expiresAt,
      bookingStartDate: booking.startDate,
      carName: car?.make && car?.model ? `${car.make} ${car.model}` : undefined,
    });

    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });

    logger.info(
      {
        userId: user._id,
        bookingId: booking._id,
      },
      'Payment reminder email sent successfully',
    );
  } catch (error: any) {
    logger.error(
      {
        error: error.message,
        userId: user._id,
        bookingId: booking._id,
      },
      'Failed to send payment reminder email',
    );
  }
};

export const sendAdminRefundNotification = async (
  transaction: ITransactionDocument,
  booking: IBookingDocument,
  user: IUserDocument,
) => {
  try {
    logger.info(
      {
        userId: user._id,
        bookingId: booking._id,
        transactionId: transaction._id,
        refundAmount: transaction.amount,
      },
      'Admin refund notification: Manual refund processing required',
    );
  } catch (error: any) {
    logger.error(
      {
        error: error.message,
        transactionId: transaction._id,
      },
      'Failed to send admin refund notification',
    );
  }
};
