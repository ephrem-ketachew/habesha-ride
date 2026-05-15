import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as saleReservationController from '../controllers/saleReservation.controller.js';
import {
  createSaleReservationSchema,
  getSaleReservationIdSchema,
  cancelSaleReservationSchema,
  confirmSaleReservationSchema,
  scheduleInspectionSchema,
  getSaleReservationsQuerySchema,
} from '../validation/sale.validation.js';

const router = Router();

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Sale Reservations
 *   description: Car sale reservation management
 */

/**
 * @swagger
 * /sale/reservations:
 *   post:
 *     summary: Create a sale reservation
 *     tags: [Sale Reservations]
 *     description: Create a reservation for a car sale. This initiates the reservation process. Payment must be completed separately via the payment endpoint.
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
 *             properties:
 *               listingId:
 *                 type: string
 *                 description: Sale listing ID - must be a valid MongoDB ObjectId
 *                 example: 507f1f77bcf86cd799439011
 *     responses:
 *       201:
 *         description: Reservation created successfully. Payment can now be initiated.
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
 *                     reservation:
 *                       $ref: '#/components/schemas/SaleReservation'
 *                     nextStep:
 *                       type: string
 *                       example: initialize_payment
 *                     message:
 *                       type: string
 *                       example: Reservation created. Please proceed with payment to secure your reservation.
 *       400:
 *         description: Bad request - validation error, listing not available, self-purchase attempt, or duplicate reservation
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       404:
 *         description: Listing not found
 */
router.post(
  '/',
  validate(createSaleReservationSchema, 'body'),
  saleReservationController.createReservationHandler,
);

/**
 * @swagger
 * /sale/reservations:
 *   get:
 *     summary: Get buyer's reservations
 *     tags: [Sale Reservations]
 *     description: Retrieve all reservations where the authenticated user is the buyer. Returns reservations sorted by creation date (newest first).
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled, expired]
 *         description: Filter by reservation status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Successfully retrieved buyer's reservations
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  validate(getSaleReservationsQuerySchema, 'query'),
  saleReservationController.getMyReservationsHandler,
);

/**
 * @swagger
 * /sale/reservations/seller:
 *   get:
 *     summary: Get seller's reservations
 *     tags: [Sale Reservations]
 *     description: Retrieve all reservations for listings owned by the authenticated user. Returns reservations sorted by creation date (newest first).
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled, expired]
 *         description: Filter by reservation status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Successfully retrieved seller's reservations
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/seller',
  validate(getSaleReservationsQuerySchema, 'query'),
  saleReservationController.getSellerReservationsHandler,
);

/**
 * @swagger
 * /sale/reservations/{id}:
 *   get:
 *     summary: Get reservation details by ID
 *     tags: [Sale Reservations]
 *     description: Retrieve detailed information about a specific reservation. Only the buyer, seller, or admin can view the reservation details.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID - must be a valid MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Successfully retrieved reservation details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not authorized to view this reservation
 *       404:
 *         description: Reservation not found
 */
router.get(
  '/:id',
  validate(getSaleReservationIdSchema, 'params'),
  saleReservationController.getReservationHandler,
);

/**
 * @swagger
 * /sale/reservations/{id}/cancel:
 *   patch:
 *     summary: Cancel reservation (buyer)
 *     tags: [Sale Reservations]
 *     description: Cancel a reservation. Only the buyer can cancel. Refund amount is calculated based on timing (95% if <48h, 50% if 48-72h, 0% if >72h).
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 description: Reason for cancellation
 *     responses:
 *       200:
 *         description: Reservation cancelled successfully
 *       400:
 *         description: Bad request - cannot cancel reservation with current status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only buyer can cancel
 *       404:
 *         description: Reservation not found
 */
router.patch(
  '/:id/cancel',
  validate(getSaleReservationIdSchema, 'params'),
  validate(cancelSaleReservationSchema, 'body'),
  saleReservationController.cancelReservationHandler,
);

/**
 * @swagger
 * /sale/reservations/{id}/seller-cancel:
 *   patch:
 *     summary: Cancel reservation (seller)
 *     tags: [Sale Reservations]
 *     description: Cancel a reservation as seller. Buyer receives 110% refund (100% + 10% penalty).
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 description: Reason for cancellation
 *     responses:
 *       200:
 *         description: Reservation cancelled successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only seller can cancel
 *       404:
 *         description: Reservation not found
 */
router.patch(
  '/:id/seller-cancel',
  validate(getSaleReservationIdSchema, 'params'),
  validate(cancelSaleReservationSchema, 'body'),
  saleReservationController.sellerCancelReservationHandler,
);

/**
 * @swagger
 * /sale/reservations/{id}/confirm:
 *   patch:
 *     summary: Confirm reservation after inspection (buyer)
 *     tags: [Sale Reservations]
 *     description: Buyer confirms they want to proceed with the purchase after physical inspection. Payment must be completed first.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               inspectionNotes:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Notes from inspection
 *               agreedSettlementMethod:
 *                 type: string
 *                 enum: [bank_transfer, cpo, cash, other]
 *                 description: Agreed method for final settlement
 *     responses:
 *       200:
 *         description: Reservation confirmed successfully
 *       400:
 *         description: Bad request - payment not completed or invalid status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only buyer can confirm
 *       404:
 *         description: Reservation not found
 */
router.patch(
  '/:id/confirm',
  validate(getSaleReservationIdSchema, 'params'),
  validate(confirmSaleReservationSchema, 'body'),
  saleReservationController.confirmReservationHandler,
);

/**
 * @swagger
 * /sale/reservations/{id}/schedule-inspection:
 *   patch:
 *     summary: Schedule inspection (seller)
 *     tags: [Sale Reservations]
 *     description: Seller schedules a physical inspection meeting with the buyer. Payment must be completed first.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inspectionDate
 *               - inspectionLocation
 *             properties:
 *               inspectionDate:
 *                 type: string
 *                 format: date-time
 *                 description: Scheduled inspection date/time (must be in the future)
 *               inspectionLocation:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *                 description: Location for inspection
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 description: Additional notes
 *     responses:
 *       200:
 *         description: Inspection scheduled successfully
 *       400:
 *         description: Bad request - payment not completed or invalid date
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only seller can schedule inspection
 *       404:
 *         description: Reservation not found
 */
router.patch(
  '/:id/schedule-inspection',
  validate(getSaleReservationIdSchema, 'params'),
  validate(scheduleInspectionSchema, 'body'),
  saleReservationController.scheduleInspectionHandler,
);

/**
 * @swagger
 * /sale/reservations/{id}/regenerate-agreement:
 *   post:
 *     summary: Regenerate purchase agreement PDF (Admin only)
 *     tags: [Sale Reservations - Admin]
 *     description: Regenerate the purchase agreement PDF for a reservation. Useful if the original PDF failed to generate or needs to be updated.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
 *     responses:
 *       200:
 *         description: Purchase agreement regenerated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: Reservation not found
 */
router.post(
  '/:id/regenerate-agreement',
  protect,
  restrictTo('admin', 'superadmin'),
  validate(getSaleReservationIdSchema, 'params'),
  saleReservationController.regenerateAgreementHandler,
);

export default router;

