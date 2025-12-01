import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as bookingController from '../controllers/booking.controller.js';
import {
  createBookingSchema,
  getBookingIdSchema,
  updateBookingStatusBodySchema,
} from '../validation/booking.validation.js';

const router = Router();

router.use(protect);

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     description: Create a new booking for a rental listing. The booking will be automatically confirmed if the listing has instant booking enabled, otherwise it will be pending owner approval. Requires authentication.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - listingId
 *               - startDate
 *               - endDate
 *             properties:
 *               listingId:
 *                 type: string
 *                 description: Rental listing ID - must be a valid MongoDB ObjectId
 *                 example: 507f1f77bcf86cd799439011
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Booking start date and time (must be in the future and respect advanceNoticeHours requirement)
 *                 example: "2024-02-01T10:00:00Z"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Booking end date and time (must be after startDate)
 *                 example: "2024-02-05T18:00:00Z"
 *               deliveryRequested:
 *                 type: boolean
 *                 default: false
 *                 description: Whether delivery service is requested (optional, requires listing to have deliveryAvailable enabled)
 *                 example: true
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     booking:
 *                       $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Bad request - validation error, dates in past, endDate before startDate, self-booking attempt, or delivery not available
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       404:
 *         description: Listing not found
 *       409:
 *         description: Conflict - car is not available for the selected dates
 */
router.post(
  '/',
  validate(createBookingSchema, 'body'),
  bookingController.createBookingHandler,
);

/**
 * @swagger
 * /bookings/renter/my-bookings:
 *   get:
 *     summary: Get current user's bookings (as renter)
 *     tags: [Bookings]
 *     description: Retrieve all bookings where the authenticated user is the renter. Returns bookings sorted by creation date (newest first).
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user's bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                   description: Number of bookings returned
 *                   example: 5
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 */
router.get('/renter/my-bookings', bookingController.getMyBookingsHandler);

/**
 * @swagger
 * /bookings/owner/my-reservations:
 *   get:
 *     summary: Get current user's incoming reservations (as owner)
 *     tags: [Bookings]
 *     description: Retrieve all bookings where the authenticated user is the car owner. Returns bookings sorted by creation date (newest first).
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user's reservations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                   description: Number of reservations returned
 *                   example: 8
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 */
router.get(
  '/owner/my-reservations',
  bookingController.getMyReservationsHandler,
);

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get booking details by ID
 *     tags: [Bookings]
 *     description: Retrieve detailed information about a specific booking. Only the renter or owner can view the booking details. Returns full booking object with populated car, renter, and owner information.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID - must be a valid MongoDB ObjectId
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Successfully retrieved booking details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     booking:
 *                       $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Bad request - invalid ID format
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - not authorized to view this booking (not the renter or owner)
 *       404:
 *         description: Booking not found
 */
router.get(
  '/:id',
  validate(getBookingIdSchema, 'params'),
  bookingController.getBookingHandler,
);

/**
 * @swagger
 * /bookings/{id}/status:
 *   patch:
 *     summary: Update booking status
 *     tags: [Bookings]
 *     description: |
 *       Update the status of a booking. Authorization rules:
 *       - Only the owner can confirm or reject bookings (from pending status)
 *       - Both renter and owner can cancel bookings (except active or completed bookings)
 *       - Cannot cancel a booking that is already cancelled or rejected
 *       - Cannot change status if booking is already in the target status
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID - must be a valid MongoDB ObjectId
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [confirmed, rejected, cancelled]
 *                 description: |
 *                   New booking status:
 *                   - confirmed: Owner confirms the booking (only owner can do this, booking must be pending)
 *                   - rejected: Owner rejects the booking (only owner can do this, booking must be pending)
 *                   - cancelled: Cancel the booking (renter or owner can do this, cannot cancel active or completed bookings)
 *                 example: confirmed
 *               cancellationReason:
 *                 type: string
 *                 description: Reason for cancellation (optional, only used when status is cancelled)
 *                 example: "Change of plans"
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     booking:
 *                       $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Bad request - invalid ID format, invalid status transition, or booking already in target status
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - not authorized to perform this action (e.g., renter trying to confirm their own booking)
 *       404:
 *         description: Booking not found
 */
router.patch(
  '/:id/status',
  validate(getBookingIdSchema, 'params'),
  validate(updateBookingStatusBodySchema, 'body'),
  bookingController.updateBookingStatusHandler,
);

export default router;
