import * as cron from 'node-cron';
import logger from '../config/logger.config.js';
import * as saleReservationService from './saleReservation.service.js';
import * as paymentService from './payment.service.js';
import * as saleEmailService from './saleEmail.service.js';

/**
 * Cron Jobs Service for Automated Tasks
 * Handles periodic tasks like reservation expiry checking and email reminders
 */

/**
 * Check for expired reservations and process them
 * Runs every hour to find reservations that have passed their 48-hour expiry
 */
const processExpiredReservations = async () => {
  try {
    logger.info('Starting expired reservations check');

    const expiredCount =
      await saleReservationService.checkAndExpireReservations();

    if (expiredCount > 0) {
      logger.info({ expiredCount }, 'Processed expired reservations');
    } else {
      logger.debug('No expired reservations found');
    }
  } catch (error: any) {
    logger.error(
      { error: error.message, stack: error.stack },
      'Error processing expired reservations',
    );
  }
};

/**
 * Send reminder emails for reservations expiring soon
 * Runs every hour to check for reservations expiring in 24h and 6h
 */
const sendExpiryReminders = async () => {
  try {
    logger.info('Starting expiry reminder check');

    const now = new Date();

    // Find reservations expiring in 24 hours (between 23-25 hours from now)
    const twentyFourHoursFromNow = new Date(
      now.getTime() + 24 * 60 * 60 * 1000,
    );
    const twentyFourHourWindowStart = new Date(
      now.getTime() + 23 * 60 * 60 * 1000,
    );
    const twentyFourHourWindowEnd = new Date(
      now.getTime() + 25 * 60 * 60 * 1000,
    );

    // Find reservations expiring in 6 hours (between 5-7 hours from now)
    const sixHourWindowStart = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    const sixHourWindowEnd = new Date(now.getTime() + 7 * 60 * 60 * 1000);

    // Get reservations from database
    const SaleReservation = (await import('../models/saleReservation.model.js'))
      .default;

    // 24-hour reminders
    const reservationsExpiring24h = await SaleReservation.find({
      status: 'pending',
      paymentStatus: 'paid',
      expiresAt: {
        $gte: twentyFourHourWindowStart,
        $lt: twentyFourHourWindowEnd,
      },
      // Only send once - check if we haven't sent this reminder before
      reminderSent24h: { $ne: true },
    })
      .populate('buyer', 'firstName lastName email')
      .populate('seller', 'firstName lastName email')
      .populate({
        path: 'car',
        populate: [{ path: 'make' }, { path: 'vehicleModel' }],
      })
      .populate('listing');

    // 6-hour reminders
    const reservationsExpiring6h = await SaleReservation.find({
      status: 'pending',
      paymentStatus: 'paid',
      expiresAt: {
        $gte: sixHourWindowStart,
        $lt: sixHourWindowEnd,
      },
      // Only send once - check if we haven't sent this reminder before
      reminderSent6h: { $ne: true },
    })
      .populate('buyer', 'firstName lastName email')
      .populate('seller', 'firstName lastName email')
      .populate({
        path: 'car',
        populate: [{ path: 'make' }, { path: 'vehicleModel' }],
      })
      .populate('listing');

    // Send 24-hour reminders
    for (const reservation of reservationsExpiring24h) {
      try {
        await saleEmailService.sendReservationExpiryReminderEmail(
          reservation.buyer as any,
          reservation.car as any,
          reservation as any,
          24,
        );

        // Mark as sent
        await SaleReservation.findByIdAndUpdate(reservation._id, {
          reminderSent24h: true,
        });

        logger.info(
          { reservationId: reservation._id, hoursRemaining: 24 },
          '24-hour expiry reminder email sent',
        );
      } catch (error: any) {
        logger.error(
          { reservationId: reservation._id, error: error.message },
          'Failed to send 24-hour expiry reminder email',
        );
      }
    }

    // Send 6-hour reminders
    for (const reservation of reservationsExpiring6h) {
      try {
        await saleEmailService.sendReservationExpiryReminderEmail(
          reservation.buyer as any,
          reservation.car as any,
          reservation as any,
          6,
        );

        // Mark as sent
        await SaleReservation.findByIdAndUpdate(reservation._id, {
          reminderSent6h: true,
        });

        logger.info(
          { reservationId: reservation._id, hoursRemaining: 6 },
          '6-hour expiry reminder email sent',
        );
      } catch (error: any) {
        logger.error(
          { reservationId: reservation._id, error: error.message },
          'Failed to send 6-hour expiry reminder email',
        );
      }
    }

    const totalReminders =
      reservationsExpiring24h.length + reservationsExpiring6h.length;
    if (totalReminders > 0) {
      logger.info(
        {
          reminders24h: reservationsExpiring24h.length,
          reminders6h: reservationsExpiring6h.length,
          total: totalReminders,
        },
        'Expiry reminders sent',
      );
    } else {
      logger.debug('No expiry reminders to send');
    }
  } catch (error: any) {
    logger.error(
      { error: error.message, stack: error.stack },
      'Error sending expiry reminders',
    );
  }
};

/**
 * Initialize all cron jobs
 */
export const initializeCronJobs = () => {
  logger.info('Initializing cron jobs');

  // Run every hour: Check for expired reservations
  cron.schedule('0 * * * *', async () => {
    logger.debug('Running hourly expired reservations check');
    await processExpiredReservations();
  });

  // Run every hour: Send expiry reminders
  cron.schedule('30 * * * *', async () => {
    logger.debug('Running hourly expiry reminders check');
    await sendExpiryReminders();
  });

  logger.info(
    {
      jobs: [
        'Expired reservations check (every hour at :00)',
        'Expiry reminders (every hour at :30)',
      ],
    },
    'Cron jobs initialized successfully',
  );
};

/**
 * Manually trigger jobs for testing (admin only)
 */
export const triggerExpiredReservationsCheck = async () => {
  logger.info('Manually triggering expired reservations check');
  return await processExpiredReservations();
};

export const triggerExpiryReminders = async () => {
  logger.info('Manually triggering expiry reminders');
  return await sendExpiryReminders();
};

/**
 * Get cron job status for monitoring
 */
export const getCronJobStatus = () => {
  return {
    initialized: true,
    jobs: [
      {
        name: 'Expired Reservations Check',
        schedule: 'Every hour at minute 0',
        description:
          'Automatically expires reservations after 48 hours and processes refunds',
      },
      {
        name: 'Expiry Reminders',
        schedule: 'Every hour at minute 30',
        description:
          'Sends email reminders 24h and 6h before reservation expiry',
      },
    ],
  };
};
