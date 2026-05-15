/**
 * @swagger
 * components:
 *   schemas:
 *     SaleReservation:
 *       type: object
 *       required:
 *         - listing
 *         - car
 *         - buyer
 *         - seller
 *         - salePrice
 *         - reservationFee
 *       properties:
 *         _id:
 *           type: string
 *           description: Reservation ID
 *           example: 507f1f77bcf86cd799439011
 *         listing:
 *           type: string
 *           description: Sale listing ID reference
 *           example: 507f1f77bcf86cd799439012
 *         car:
 *           type: string
 *           description: Car ID reference (denormalized for speed)
 *           example: 507f1f77bcf86cd799439013
 *         buyer:
 *           type: string
 *           description: User ID who reserved the car
 *           example: 507f1f77bcf86cd799439014
 *         seller:
 *           type: string
 *           description: Car owner ID (denormalized)
 *           example: 507f1f77bcf86cd799439015
 *         salePrice:
 *           type: number
 *           minimum: 0
 *           description: Sale price at time of reservation (ETB)
 *           example: 1500000
 *         reservationFee:
 *           type: number
 *           minimum: 0
 *           description: Amount paid to reserve (1% of sale price, min 5000, max 50000 ETB)
 *           example: 15000
 *         platformServiceFee:
 *           type: number
 *           minimum: 0
 *           description: Platform commission (2% of sale price)
 *           example: 30000
 *         finalSettlementAmount:
 *           type: number
 *           minimum: 0
 *           description: Amount remaining to be paid offline (salePrice - reservationFee)
 *           example: 1485000
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, refunded, failed]
 *           default: pending
 *           description: Payment status of reservation fee
 *         paymentTransaction:
 *           type: string
 *           description: Transaction ID reference
 *         paymentMethod:
 *           type: string
 *           description: Payment method used (chapa, telebirr, stripe)
 *         status:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled, expired]
 *           default: pending
 *           description: Reservation status (pending → confirmed → completed, or cancelled/expired)
 *         reservedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when reservation was created
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when reservation expires (48 hours default)
 *         confirmedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when buyer confirmed after inspection
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when final settlement was completed
 *         cancelledAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when reservation was cancelled
 *         cancellationReason:
 *           type: string
 *           description: Reason for cancellation
 *         cancelledBy:
 *           type: string
 *           enum: [buyer, seller, admin, system]
 *           description: Who cancelled the reservation
 *         refundAmount:
 *           type: number
 *           description: Amount refunded to buyer
 *         refundStatus:
 *           type: string
 *           enum: [pending, processed, failed]
 *           description: Status of refund processing
 *         refundTransaction:
 *           type: string
 *           description: Refund transaction ID reference
 *         inspectionScheduled:
 *           type: boolean
 *           default: false
 *           description: Whether physical inspection has been scheduled
 *         inspectionDate:
 *           type: string
 *           format: date-time
 *           description: Scheduled inspection date/time
 *         inspectionLocation:
 *           type: string
 *           description: Location for physical inspection
 *         inspectionNotes:
 *           type: string
 *           description: Notes from inspection
 *         agentAssigned:
 *           type: string
 *           description: Agent user ID assigned to facilitate sale
 *         settlementMethod:
 *           type: string
 *           enum: [bank_transfer, cpo, cash, other]
 *           description: Method used for final settlement
 *         settlementReference:
 *           type: string
 *           description: Bank reference or receipt number for settlement
 *         settlementCompletedAt:
 *           type: string
 *           format: date-time
 *           description: When offline settlement was completed
 *         transportAuthorityTransferDate:
 *           type: string
 *           format: date-time
 *           description: Date of ownership transfer at Transport Authority
 *         purchaseAgreementUrl:
 *           type: string
 *           description: URL to generated purchase agreement PDF
 *         purchaseAgreementGeneratedAt:
 *           type: string
 *           format: date-time
 *           description: When purchase agreement PDF was generated
 *         additionalDocuments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               url:
 *                 type: string
 *               uploadedAt:
 *                 type: string
 *                 format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
import mongoose, { Schema } from 'mongoose';
import mongooseSanitize from 'mongoose-sanitize';
import {
  ISaleReservationDocument,
  ReservationStatus,
  PaymentStatus,
  RefundStatus,
  CancelledBy,
  SettlementMethod,
} from '../types/saleReservation.types.js';

const additionalDocumentSchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const saleReservationSchema = new Schema<ISaleReservationDocument>(
  {
    listing: {
      type: Schema.Types.ObjectId,
      ref: 'SaleListing',
      required: true,
      index: true,
    },
    car: {
      type: Schema.Types.ObjectId,
      ref: 'Car',
      required: true,
      index: true,
    },
    buyer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    salePrice: {
      type: Number,
      required: true,
      min: [0, 'Sale price cannot be negative.'],
    },
    reservationFee: {
      type: Number,
      required: true,
      min: [0, 'Reservation fee cannot be negative.'],
    },
    platformServiceFee: {
      type: Number,
      required: true,
      min: [0, 'Service fee cannot be negative.'],
      default: function (this: ISaleReservationDocument) {
        return Math.round(this.salePrice * 0.02 * 100) / 100; // 2% commission
      },
    },
    finalSettlementAmount: {
      type: Number,
      required: true,
      min: [0, 'Final settlement amount cannot be negative.'],
      default: function (this: ISaleReservationDocument) {
        return this.salePrice - this.reservationFee;
      },
    },

    paymentStatus: {
      type: String,
      enum: Object.values([
        'pending',
        'paid',
        'refunded',
        'failed',
      ] as PaymentStatus[]),
      default: 'pending',
      index: true,
    },
    paymentTransaction: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    paymentMethod: {
      type: String,
    },

    status: {
      type: String,
      enum: Object.values([
        'pending',
        'confirmed',
        'completed',
        'cancelled',
        'expired',
      ] as ReservationStatus[]),
      default: 'pending',
      required: true,
      index: true,
    },
    reservedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: function () {
        return new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now
      },
      index: true,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      trim: true,
    },
    cancelledBy: {
      type: String,
      enum: Object.values([
        'buyer',
        'seller',
        'admin',
        'system',
      ] as CancelledBy[]),
    },
    refundAmount: {
      type: Number,
      min: [0, 'Refund amount cannot be negative.'],
      default: 0,
    },
    refundStatus: {
      type: String,
      enum: Object.values(['pending', 'processed', 'failed'] as RefundStatus[]),
    },
    refundTransaction: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
    },

    inspectionScheduled: {
      type: Boolean,
      default: false,
    },
    inspectionDate: {
      type: Date,
    },
    inspectionLocation: {
      type: String,
      trim: true,
    },
    inspectionNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Inspection notes cannot exceed 1000 characters.'],
    },
    agentAssigned: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    settlementMethod: {
      type: String,
      enum: Object.values([
        'bank_transfer',
        'cpo',
        'cash',
        'other',
      ] as SettlementMethod[]),
    },
    settlementReference: {
      type: String,
      trim: true,
    },
    settlementCompletedAt: {
      type: Date,
    },
    transportAuthorityTransferDate: {
      type: Date,
    },

    purchaseAgreementUrl: {
      type: String,
    },
    purchaseAgreementGeneratedAt: {
      type: Date,
    },
    additionalDocuments: [additionalDocumentSchema],

    reminderSent24h: {
      type: Boolean,
      default: false,
    },
    reminderSent6h: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

saleReservationSchema.plugin(mongooseSanitize);

saleReservationSchema.index({ buyer: 1, status: 1 });
saleReservationSchema.index({ seller: 1, status: 1 });
saleReservationSchema.index({ status: 1, expiresAt: 1 });
saleReservationSchema.index({ listing: 1, status: 1 });
saleReservationSchema.index({ paymentStatus: 1, status: 1 });

saleReservationSchema.virtual('timeRemaining').get(function (
  this: ISaleReservationDocument,
) {
  if (this.status !== 'pending') return 0;
  const now = new Date();
  const remaining = this.expiresAt.getTime() - now.getTime();
  return Math.max(0, remaining);
});

saleReservationSchema.virtual('isExpired').get(function (
  this: ISaleReservationDocument,
) {
  return new Date() > this.expiresAt && this.status === 'pending';
});

saleReservationSchema.set('toJSON', { virtuals: true });
saleReservationSchema.set('toObject', { virtuals: true });

const SaleReservation = mongoose.model<ISaleReservationDocument>(
  'SaleReservation',
  saleReservationSchema,
);

export default SaleReservation;
