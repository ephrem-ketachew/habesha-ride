import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  getUserAnalyticsHandler,
  getAdminAnalyticsHandler,
} from '../controllers/analytics.controller.js';
import {
  getUserAnalyticsSchema,
  getAdminAnalyticsSchema,
} from '../validation/analytics.validation.js';

const router = Router();


/**
 * @swagger
 * /analytics/user/analytics:
 *   get:
 *     summary: Get analytics for the authenticated user
 *     tags: [Analytics]
 *     description: >
 *       Returns analytics data for the logged-in user, including
 *       booking counts by status, total spending, booking trends,
 *       earnings, and activity frequency.
 *       Supports optional date range filtering and time grouping.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date (ISO format) for filtering analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date (ISO format) for filtering analytics
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *         description: Time grouping for analytics results
 *     responses:
 *       200:
 *         description: User analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalBookings:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 *                       description: Booking counts grouped by status
 *                     totalSpent:
 *                       type: number
 *                       description: Total amount spent on completed bookings
 *                     averageBookingValue:
 *                       type: number
 *                       description: Average value per booking
 *                     bookingHistoryTrends:
 *                       type: array
 *                       description: Booking activity over time
 *                       items:
 *                         type: object
 *                         properties:
 *                           period:
 *                             type: string
 *                           count:
 *                             type: number
 *                           total:
 *                             type: number
 *                     carsListed:
 *                       type: number
 *                       description: Number of cars listed by the user
 *                     bookingsReceived:
 *                       type: number
 *                       description: Number of bookings received as an owner
 *                     earnings:
 *                       type: number
 *                       description: Total earnings from completed bookings
 *                     bookingFrequency:
 *                       type: number
 *                       description: Average number of bookings per month
 *       401:
 *         description: Unauthorized
 */

router.get(
  '/user/analytics',
  protect,
  validate(getUserAnalyticsSchema, 'query'),
  getUserAnalyticsHandler,
);



/**
 * @swagger
 * /analytics/admin/analytics:
 *   get:
 *     summary: Get platform-wide analytics (Admin)
 *     tags: [Analytics]
 *     description: >
 *       Returns aggregated analytics for the entire platform including
 *       users, bookings, financial metrics, and engagement insights.
 *       Supports optional date range filtering and time grouping.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date (ISO format) for analytics filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date (ISO format) for analytics filtering
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *         description: Group analytics by time period
 *     responses:
 *       200:
 *         description: Admin analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: object
 *                           additionalProperties:
 *                             type: number
 *                         totalUsersByStatus:
 *                           type: object
 *                           additionalProperties:
 *                             type: number
 *                         totalBookings:
 *                           type: object
 *                           additionalProperties:
 *                             type: number
 *                         totalRevenue:
 *                           type: number
 *                         activeListings:
 *                           type: number
 *                     financial:
 *                       type: object
 *                       properties:
 *                         revenueTrends:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               period:
 *                                 type: string
 *                               count:
 *                                 type: number
 *                               total:
 *                                 type: number
 *                         serviceFeesCollected:
 *                           type: number
 *                         refunds:
 *                           type: number
 *                         transactionSuccessRate:
 *                           type: number
 *                     userInsights:
 *                       type: object
 *                       properties:
 *                         newRegistrations:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               period:
 *                                 type: string
 *                               count:
 *                                 type: number
 *                         userGrowth:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               period:
 *                                 type: string
 *                               count:
 *                                 type: number
 *                         verificationRates:
 *                           type: object
 *                           properties:
 *                             verified:
 *                               type: number
 *                             total:
 *                               type: number
 *                             percent:
 *                               type: number
 *                         userEngagement:
 *                           type: object
 *                           properties:
 *                             activeUsers:
 *                               type: number
 *                             totalUsers:
 *                               type: number
 *                             percent:
 *                               type: number
 *                     bookingInsights:
 *                       type: object
 *                       properties:
 *                         completionRate:
 *                           type: number
 *                         cancellationRate:
 *                           type: number
 *                         popularMakesModels:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               make:
 *                                 type: string
 *                               model:
 *                                 type: string
 *                               count:
 *                                 type: number
 *                         averageBookingDuration:
 *                           type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin access only)
 */

router.get(
  '/admin/analytics',
  protect,
  restrictTo('admin', 'superadmin'),
  validate(getAdminAnalyticsSchema, 'query'),
  getAdminAnalyticsHandler,
);

export default router;