import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.util.js';
import * as cronJobsService from '../services/cronJobs.service.js';

export const getCronJobsStatusHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const status = cronJobsService.getCronJobStatus();

    res.status(200).json({
      status: 'success',
      data: status,
    });
  },
);

export const triggerExpiredReservationsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await cronJobsService.triggerExpiredReservationsCheck();

    res.status(200).json({
      status: 'success',
      message: `Expired reservations check completed. Processed ${result} reservations.`,
      data: {
        expiredReservationsProcessed: result,
      },
    });
  },
);

export const triggerRemindersHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await cronJobsService.triggerExpiryReminders();

    res.status(200).json({
      status: 'success',
      message: 'Expiry reminders check completed and emails sent.',
    });
  },
);
