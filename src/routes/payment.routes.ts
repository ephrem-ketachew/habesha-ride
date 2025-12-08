import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as paymentController from '../controllers/payment.controller.js';
import * as paymentValidation from '../validation/payment.validation.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment processing and transaction management
 */

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Chapa webhook endpoint (PUBLIC)
 *     tags: [Payments]
 *     description: Receives payment status updates from Chapa. Secured by signature verification.
 *     responses:
 *       200:
 *         description: Webhook processed
 */

/**
 * @swagger
 * /payments/initialize:
 *   post:
 *     summary: Initialize payment for a booking
 *     tags: [Payments]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *             properties:
 *               bookingId:
 *                 type: string
 *                 description: Booking ID to pay for
 *     responses:
 *       200:
 *         description: Payment initialized successfully
 *       400:
 *         description: Bad request (booking already paid, invalid status)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to pay for this booking
 *       404:
 *         description: Booking not found
 */
router.post(
  '/initialize',
  protect,
  validate(paymentValidation.initializePaymentSchema, 'body'),
  paymentController.initializePaymentHandler,
);

/**
 * @swagger
 * /payments/verify/{tx_ref}:
 *   get:
 *     summary: Verify payment status
 *     tags: [Payments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: tx_ref
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction reference from Chapa
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *       402:
 *         description: Payment failed or cancelled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to verify this transaction
 *       404:
 *         description: Transaction not found
 */
router.get(
  '/verify/:tx_ref',
  protect,
  validate(paymentValidation.verifyPaymentSchema, 'params'),
  paymentController.verifyPaymentHandler,
);

/**
 * @swagger
 * /payments/booking/{bookingId}:
 *   get:
 *     summary: Get all transactions for a booking
 *     tags: [Payments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to view these transactions
 *       404:
 *         description: Booking not found
 */
router.get(
  '/booking/:bookingId',
  protect,
  validate(paymentValidation.getTransactionsByBookingSchema, 'params'),
  paymentController.getTransactionsByBookingHandler,
);

/**
 * @swagger
 * /payments/transaction/{transactionId}:
 *   get:
 *     summary: Get single transaction details
 *     tags: [Payments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to view this transaction
 *       404:
 *         description: Transaction not found
 */
router.get(
  '/transaction/:transactionId',
  protect,
  validate(paymentValidation.getTransactionSchema, 'params'),
  paymentController.getTransactionHandler,
);

/**
 * @swagger
 * /payments/refund/{transactionId}:
 *   post:
 *     summary: Process refund (ADMIN ONLY)
 *     tags: [Payments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
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
 *                 description: Reason for refund
 *     responses:
 *       200:
 *         description: Refund initiated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 *       404:
 *         description: Transaction not found
 */
router.post(
  '/refund/:transactionId',
  protect,
  restrictTo('admin', 'superadmin'),
  validate(paymentValidation.refundPaymentParamsSchema, 'params'),
  validate(paymentValidation.refundPaymentBodySchema, 'body'),
  paymentController.processRefundHandler,
);

/**
 * @swagger
 * /payments/admin/transactions:
 *   get:
 *     summary: Get all transactions with filters (ADMIN ONLY)
 *     tags: [Payments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled, refund_pending, refunded, refund_failed]
 *         description: Filter by transaction status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [payment, refund, deposit, excess]
 *         description: Filter by transaction type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of results to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 */
router.get(
  '/admin/transactions',
  protect,
  restrictTo('admin', 'superadmin'),
  validate(paymentValidation.adminTransactionFiltersSchema, 'query'),
  paymentController.getAllTransactionsHandler,
);

/**
 * @swagger
 * /payments/admin/refund/{transactionId}/complete:
 *   patch:
 *     summary: Mark refund as completed (Admin only)
 *     description: |
 *       Mark a refund transaction as completed after manually processing it via Chapa dashboard.
 *       This will update the transaction status and send a notification email to the user.
 *     tags: [Payments - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID of the refund to mark as completed
 *     responses:
 *       200:
 *         description: Refund marked as completed successfully
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
 *                     transaction:
 *                       type: object
 *                 message:
 *                   type: string
 *                   example: Refund marked as completed. User has been notified via email.
 *       400:
 *         description: Invalid request (not a refund or already completed)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 *       404:
 *         description: Transaction not found
 */
router.patch(
  '/admin/refund/:transactionId/complete',
  protect,
  restrictTo('admin', 'superadmin'),
  validate(paymentValidation.getTransactionSchema, 'params'),
  paymentController.completeRefundHandler,
);

export default router;
