/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       required:
 *         - booking
 *         - user
 *         - type
 *         - status
 *         - provider
 *         - amount
 *         - currency
 *         - chapaTxRef
 *         - idempotencyKey
 *       properties:
 *         _id:
 *           type: string
 *           description: Transaction ID
 *         booking:
 *           type: string
 *           description: Reference to Booking
 *         user:
 *           type: string
 *           description: User who initiated transaction
 *         type:
 *           type: string
 *           enum: [payment, refund, deposit, excess]
 *           description: Transaction type
 *         status:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled, refund_pending, refunded, refund_failed]
 *           description: Transaction status
 *         provider:
 *           type: string
 *           enum: [chapa, manual]
 *           description: Payment provider
 *         amount:
 *           type: number
 *           description: Amount in ETB
 *         currency:
 *           type: string
 *           default: ETB
 *         breakdown:
 *           type: object
 *           properties:
 *             rentalFee:
 *               type: number
 *             securityDeposit:
 *               type: number
 *             serviceFee:
 *               type: number
 *             deliveryFee:
 *               type: number
 *             discountAmount:
 *               type: number
 *         chapaTxRef:
 *           type: string
 *           description: Unique Chapa transaction reference
 *         chapaCheckoutUrl:
 *           type: string
 *           description: Chapa payment URL
 *         chapaTransactionId:
 *           type: string
 *           description: Chapa's internal transaction ID
 *         chapaPaymentMethod:
 *           type: string
 *           description: Payment method used (e.g., telebirr, cbe)
 *         webhookReceived:
 *           type: boolean
 *           default: false
 *         idempotencyKey:
 *           type: string
 *           description: Unique key to prevent duplicate processing
 *         attempts:
 *           type: number
 *           default: 0
 *         initiatedAt:
 *           type: string
 *           format: date-time
 *         completedAt:
 *           type: string
 *           format: date-time
 *         failedAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
import mongoose, { Schema } from 'mongoose';
import {
  ITransactionDocument,
  TransactionType,
  TransactionStatus,
  PaymentProvider,
} from '../types/transaction.types.js';

const transactionSchema = new Schema<ITransactionDocument>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
      default: TransactionType.PAYMENT,
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      required: true,
      default: TransactionStatus.PENDING,
      index: true,
    },
    provider: {
      type: String,
      enum: Object.values(PaymentProvider),
      required: true,
      default: PaymentProvider.CHAPA,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'ETB',
    },
    breakdown: {
      rentalFee: { type: Number, default: 0 },
      securityDeposit: { type: Number, default: 0 },
      serviceFee: { type: Number, default: 0 },
      deliveryFee: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0 },
    },
    chapaTxRef: {
      type: String,
      unique: true,
      sparse: true, // Allow null for non-Chapa transactions
      index: true,
    },
    chapaCheckoutUrl: String,
    chapaTransactionId: String,
    chapaPaymentMethod: String,
    chapaCustomization: {
      title: String,
      description: String,
      logo: String,
    },
    chapaResponse: Schema.Types.Mixed,
    webhookReceived: {
      type: Boolean,
      default: false,
    },
    webhookPayload: Schema.Types.Mixed,
    webhookReceivedAt: Date,
    callbackUrl: String,
    returnUrl: String,
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastError: String,
    initiatedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
    failedAt: Date,
  },
  {
    timestamps: true,
  },
);

transactionSchema.index({ booking: 1, type: 1 });
transactionSchema.index({ user: 1, status: 1 });
transactionSchema.index({ chapaTxRef: 1, status: 1 });

const Transaction = mongoose.model<ITransactionDocument>(
  'Transaction',
  transactionSchema,
);

export default Transaction;
