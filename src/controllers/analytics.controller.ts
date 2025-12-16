import { Request, Response, NextFunction } from 'express';
//import * as analyticsService from '../services/analytics.service.js';
import * as userAnalyticsService from '../services/userAnalytics.service.js';
import * as adminAnalyticsService from '../services/adminAnalytics.service.js';
import catchAsync from '../utils/catchAsync.util.js';

export const getUserAnalyticsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { startDate, endDate, timeRange } = req.query;

    const analytics = await userAnalyticsService.getUserAnalytics(userId, {
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      timeRange: timeRange as any,
    });

    res.status(200).json({ status: 'success', data: analytics });
  }
);


export const getAdminAnalyticsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { startDate, endDate, timeRange } = req.query;

    const analytics = await adminAnalyticsService.getAdminAnalytics({
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      timeRange: timeRange as any,
    });

    res.status(200).json({ status: 'success', data: analytics });
  }
);
