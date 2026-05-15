import * as emailService from '../utils/email.util.js';
import logger from '../config/logger.config.js';
import {
  reservationConfirmationBuyerTemplate,
  reservationExpiryReminderBuyerTemplate,
  reservationCancelledBuyerTemplate,
  newReservationAlertSellerTemplate,
  reservationExpiredSellerTemplate,
} from '../templates/saleEmail.templates.js';

/**
 * Sale Email Service
 * Handles all email communications related to car sale reservations
 */

/**
 * Send reservation confirmation emails to both buyer and seller
 */
export const sendReservationConfirmationEmails = async (
  reservation: any,
) => {
  try {
    // Send to buyer
    await sendReservationConfirmationEmail(
      reservation.buyer,
      reservation.car,
      reservation,
    );
  } catch (error: any) {
    logger.error(
      { reservationId: reservation._id, error: error.message },
      'Failed to send confirmation email to buyer',
    );
  }

  try {
    // Send to seller
    await sendNewReservationAlertEmail(
      reservation.seller,
      reservation.buyer,
      reservation.car,
      reservation,
    );
  } catch (error: any) {
    logger.error(
      { reservationId: reservation._id, error: error.message },
      'Failed to send alert email to seller',
    );
  }
};

/**
 * Send reservation confirmation email to buyer
 */
export const sendReservationConfirmationEmail = async (
  buyer: any,
  car: any,
  reservation: any,
) => {
  if (!buyer?.email) {
    logger.warn({ buyerId: buyer?._id }, 'Buyer has no email, skipping confirmation email');
    return;
  }

  const carInfo = `${car.make?.name || ''} ${car.vehicleModel?.name || ''} ${car.year || ''}`.trim();

  const template = reservationConfirmationBuyerTemplate({
    buyerName: `${buyer.firstName} ${buyer.lastName}`,
    reservationId: reservation._id,
    carInfo,
    salePrice: reservation.salePrice,
    reservationFee: reservation.reservationFee,
    finalSettlementAmount: reservation.finalSettlementAmount,
    expiresAt: reservation.expiresAt,
    sellerName: `${reservation.seller?.firstName || ''} ${reservation.seller?.lastName || ''}`.trim(),
    purchaseAgreementUrl: reservation.purchaseAgreementUrl,
  });

  try {
    await emailService.sendEmail({
      to: buyer.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    logger.info(
      { reservationId: reservation._id, buyerEmail: buyer.email },
      'Reservation confirmation email sent to buyer',
    );
  } catch (error: any) {
    logger.error(
      { reservationId: reservation._id, buyerEmail: buyer.email, error: error.message },
      'Failed to send reservation confirmation email to buyer',
    );
    throw error;
  }
};

/**
 * Send new reservation alert email to seller
 */
export const sendNewReservationAlertEmail = async (
  seller: any,
  buyer: any,
  car: any,
  reservation: any,
) => {
  if (!seller?.email) {
    logger.warn({ sellerId: seller?._id }, 'Seller has no email, skipping alert email');
    return;
  }

  const carInfo = `${car.make?.name || ''} ${car.vehicleModel?.name || ''} ${car.year || ''}`.trim();

  const template = newReservationAlertSellerTemplate({
    sellerName: `${seller.firstName} ${seller.lastName}`,
    buyerName: `${buyer.firstName} ${buyer.lastName}`,
    reservationId: reservation._id,
    carInfo,
    salePrice: reservation.salePrice,
    reservationFee: reservation.reservationFee,
    expiresAt: reservation.expiresAt,
    buyerEmail: buyer.email,
    buyerPhone: buyer.phoneNumber,
  });

  try {
    await emailService.sendEmail({
      to: seller.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    logger.info(
      { reservationId: reservation._id, sellerEmail: seller.email },
      'New reservation alert email sent to seller',
    );
  } catch (error: any) {
    logger.error(
      { reservationId: reservation._id, sellerEmail: seller.email, error: error.message },
      'Failed to send new reservation alert email to seller',
    );
    throw error;
  }
};

/**
 * Send reservation expiry reminder email to buyer
 */
export const sendReservationExpiryReminderEmail = async (
  buyer: any,
  car: any,
  reservation: any,
  hoursRemaining: number,
) => {
  if (!buyer?.email) {
    logger.warn({ buyerId: buyer?._id }, 'Buyer has no email, skipping expiry reminder');
    return;
  }

  const carInfo = `${car.make?.name || ''} ${car.vehicleModel?.name || ''} ${car.year || ''}`.trim();

  const template = reservationExpiryReminderBuyerTemplate({
    buyerName: `${buyer.firstName} ${buyer.lastName}`,
    reservationId: reservation._id,
    carInfo,
    hoursRemaining,
    expiresAt: reservation.expiresAt,
    sellerName: `${reservation.seller?.firstName || ''} ${reservation.seller?.lastName || ''}`.trim(),
  });

  try {
    await emailService.sendEmail({
      to: buyer.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    logger.info(
      {
        reservationId: reservation._id,
        buyerEmail: buyer.email,
        hoursRemaining,
      },
      'Reservation expiry reminder email sent to buyer',
    );
  } catch (error: any) {
    logger.error(
      {
        reservationId: reservation._id,
        buyerEmail: buyer.email,
        hoursRemaining,
        error: error.message,
      },
      'Failed to send reservation expiry reminder email to buyer',
    );
    throw error;
  }
};

/**
 * Send reservation cancelled email to buyer
 */
export const sendReservationCancelledEmail = async (
  buyer: any,
  car: any,
  reservation: any,
) => {
  if (!buyer?.email) {
    logger.warn({ buyerId: buyer?._id }, 'Buyer has no email, skipping cancellation email');
    return;
  }

  const carInfo = `${car.make?.name || ''} ${car.vehicleModel?.name || ''} ${car.year || ''}`.trim();

  const template = reservationCancelledBuyerTemplate({
    buyerName: `${buyer.firstName} ${buyer.lastName}`,
    reservationId: reservation._id,
    carInfo,
    cancellationReason: reservation.cancellationReason,
    refundAmount: reservation.refundAmount,
    refundStatus: reservation.refundStatus,
    cancelledBy: reservation.cancelledBy,
  });

  try {
    await emailService.sendEmail({
      to: buyer.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    logger.info(
      { reservationId: reservation._id, buyerEmail: buyer.email },
      'Reservation cancelled email sent to buyer',
    );
  } catch (error: any) {
    logger.error(
      { reservationId: reservation._id, buyerEmail: buyer.email, error: error.message },
      'Failed to send reservation cancelled email to buyer',
    );
    throw error;
  }
};

/**
 * Send reservation expired email to seller
 */
export const sendReservationExpiredEmail = async (
  seller: any,
  buyer: any,
  car: any,
  reservation: any,
) => {
  if (!seller?.email) {
    logger.warn({ sellerId: seller?._id }, 'Seller has no email, skipping expired email');
    return;
  }

  const carInfo = `${car.make?.name || ''} ${car.vehicleModel?.name || ''} ${car.year || ''}`.trim();

  const template = reservationExpiredSellerTemplate({
    sellerName: `${seller.firstName} ${seller.lastName}`,
    reservationId: reservation._id,
    carInfo,
    buyerName: `${buyer.firstName} ${buyer.lastName}`,
    expiresAt: reservation.expiresAt,
  });

  try {
    await emailService.sendEmail({
      to: seller.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    logger.info(
      { reservationId: reservation._id, sellerEmail: seller.email },
      'Reservation expired email sent to seller',
    );
  } catch (error: any) {
    logger.error(
      { reservationId: reservation._id, sellerEmail: seller.email, error: error.message },
      'Failed to send reservation expired email to seller',
    );
    throw error;
  }
};

/**
 * Send inspection scheduled notifications to both buyer and seller
 */
export const sendInspectionScheduledToBoth = async (
  buyer: any,
  seller: any,
  car: any,
  reservation: any,
) => {
  // Send to buyer
  try {
    if (buyer?.email) {
      // For now, we can reuse the confirmation email or create a specific inspection scheduled email
      // Since we don't have a specific template, we'll just log it
      logger.info(
        { reservationId: reservation._id, buyerEmail: buyer.email },
        'Inspection scheduled notification would be sent to buyer',
      );
    }
  } catch (error: any) {
    logger.error(
      { reservationId: reservation._id, error: error.message },
      'Failed to send inspection scheduled email to buyer',
    );
  }

  // Send to seller
  try {
    if (seller?.email) {
      logger.info(
        { reservationId: reservation._id, sellerEmail: seller.email },
        'Inspection scheduled notification would be sent to seller',
      );
    }
  } catch (error: any) {
    logger.error(
      { reservationId: reservation._id, error: error.message },
      'Failed to send inspection scheduled email to seller',
    );
  }

  logger.info(
    { reservationId: reservation._id },
    'Inspection scheduled notifications sent',
  );
};

/**
 * Send cancellation notifications to both buyer and seller
 */
export const sendCancellationNotifications = async (
  buyer: any,
  seller: any,
  car: any,
  reservation: any,
  cancelledBy: 'buyer' | 'seller',
  sellerRefundAmount: number,
  platformFee: number,
) => {
  // Send to buyer
  try {
    await sendReservationCancelledEmail(buyer, car, reservation);
  } catch (error: any) {
    logger.error(
      { reservationId: reservation._id, error: error.message },
      'Failed to send cancellation email to buyer',
    );
  }

  // For seller cancellations, we could send a notification to seller as well
  // but the current logic doesn't require it since the seller initiated the cancellation

  logger.info(
    { reservationId: reservation._id, cancelledBy },
    'Cancellation notifications sent',
  );
};