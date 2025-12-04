/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       required:
 *         - car
 *         - listing
 *         - renter
 *         - owner
 *         - startDate
 *         - endDate
 *         - totalPrice
 *         - priceBreakdown
 *       properties:
 *         _id:
 *           type: string
 *           description: Booking ID
 *           example: 507f1f77bcf86cd799439011
 *         car:
 *           type: string
 *           description: Car ID (reference to Car document)
 *           example: 507f1f77bcf86cd799439012
 *         listing:
 *           type: string
 *           description: Rental listing ID (reference to RentalListing document)
 *           example: 507f1f77bcf86cd799439013
 *         renter:
 *           type: string
 *           description: Renter user ID (reference to User document)
 *           example: 507f1f77bcf86cd799439014
 *         owner:
 *           type: string
 *           description: Owner user ID (reference to User document)
 *           example: 507f1f77bcf86cd799439015
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Booking start date and time
 *           example: "2024-02-01T10:00:00Z"
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Booking end date and time (must be after startDate)
 *           example: "2024-02-05T18:00:00Z"
 *         totalPrice:
 *           type: number
 *           minimum: 0
 *           description: Total price for the booking (rounded to 2 decimal places)
 *           example: 12500.50
 *         securityDeposit:
 *           type: number
 *           minimum: 0
 *           default: 0
 *           description: Security deposit amount to be held during the trip
 *           example: 5000
 *         priceBreakdown:
 *           type: object
 *           required:
 *             - basePrice
 *             - days
 *           properties:
 *             basePrice:
 *               type: number
 *               description: Base price calculated as ratePerDay × days (rounded to 2 decimal places)
 *               example: 10000.00
 *             days:
 *               type: integer
 *               minimum: 1
 *               description: Number of rental days
 *               example: 4
 *             deliveryFee:
 *               type: number
 *               minimum: 0
 *               default: 0
 *               description: Delivery fee if delivery was requested
 *               example: 300.00
 *             discountAmount:
 *               type: number
 *               minimum: 0
 *               default: 0
 *               description: Discount amount applied (weekly or monthly discount, rounded to 2 decimal places)
 *               example: 1000.00
 *             serviceFee:
 *               type: number
 *               minimum: 0
 *               default: 0
 *               description: Service fee (5% of basePrice - discountAmount, rounded to 2 decimal places)
 *               example: 450.00
 *             excessMileageFee:
 *               type: number
 *               minimum: 0
 *               default: 0
 *               description: Excess mileage fee charged if the renter exceeds the allowed mileage (calculated at booking completion, rounded to 2 decimal places)
 *               example: 500.00
 *             cancellationFee:
 *               type: number
 *               minimum: 0
 *               default: 0
 *               description: Cancellation fee amount retained by owner/platform (calculated when booking is cancelled, rounded to 2 decimal places)
 *               example: 0.00
 *             refundAmount:
 *               type: number
 *               minimum: 0
 *               default: 0
 *               description: Refund amount returned to renter (calculated when booking is cancelled, rounded to 2 decimal places)
 *               example: 0.00
 *           description: Detailed breakdown of the booking price
 *         usageLimits:
 *           type: object
 *           properties:
 *             allowedMileagePerDay:
 *               type: number
 *               nullable: true
 *               minimum: 0
 *               description: Maximum kilometers allowed per day. null means unlimited mileage
 *               example: 200
 *             excessMileageFee:
 *               type: number
 *               minimum: 0
 *               default: 0
 *               description: Fee per kilometer charged if the renter exceeds the allowed mileage per day
 *               example: 5
 *           description: Mileage usage limits and fees
 *         odometerReadings:
 *           type: object
 *           properties:
 *             start:
 *               type: number
 *               nullable: true
 *               minimum: 0
 *               description: Odometer reading at the start of the trip (in kilometers). null if not yet recorded
 *               example: 45000
 *             end:
 *               type: number
 *               nullable: true
 *               minimum: 0
 *               description: Odometer reading at the end of the trip (in kilometers). null if not yet recorded
 *               example: 45200
 *           description: Odometer readings to track mileage usage
 *         status:
 *           type: string
 *           enum: [pending, confirmed, active, completed, cancelled, rejected]
 *           default: pending
 *           description: |
 *             Booking status:
 *             - pending: Awaiting owner confirmation
 *             - confirmed: Owner has confirmed the booking
 *             - active: Trip is currently in progress
 *             - completed: Trip has been completed
 *             - cancelled: Booking was cancelled (by renter or owner)
 *             - rejected: Owner rejected the booking request
 *           example: confirmed
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, refunded, failed]
 *           default: pending
 *           description: |
 *             Payment status:
 *             - pending: Payment not yet processed
 *             - paid: Payment successfully completed
 *             - refunded: Payment was refunded (e.g., after cancellation)
 *             - failed: Payment processing failed
 *           example: paid
 *         paymentTransactionId:
 *           type: string
 *           description: Transaction ID from the payment processor (if payment has been processed)
 *           example: "txn_1234567890abcdef"
 *         cancellationReason:
 *           type: string
 *           description: Reason for cancellation (if booking was cancelled)
 *           example: "Change of plans"
 *         cancellationPolicy:
 *           type: string
 *           enum: [flexible, moderate, strict]
 *           default: moderate
 *           description: Cancellation policy snapshot (copied from listing at booking creation). Protects renter from policy changes after booking is made.
 *           example: moderate
 *         refundAmount:
 *           type: number
 *           minimum: 0
 *           default: 0
 *           description: Refund amount returned to renter (calculated when booking is cancelled, rounded to 2 decimal places)
 *           example: 0.00
 *         cancellationFee:
 *           type: number
 *           minimum: 0
 *           default: 0
 *           description: Cancellation fee amount retained by owner/platform (calculated when booking is cancelled, rounded to 2 decimal places)
 *           example: 0.00
 *         cancelledBy:
 *           type: string
 *           enum: [renter, owner]
 *           description: Who initiated the cancellation (if booking was cancelled)
 *           example: renter
 *         cancelledAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the booking was cancelled (if booking was cancelled)
 *           example: "2024-01-20T14:30:00Z"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Booking creation timestamp
 *           example: "2024-01-15T08:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2024-01-15T10:45:00Z"
 *       example:
 *         _id: "507f1f77bcf86cd799439011"
 *         car: "507f1f77bcf86cd799439012"
 *         listing: "507f1f77bcf86cd799439013"
 *         renter: "507f1f77bcf86cd799439014"
 *         owner: "507f1f77bcf86cd799439015"
 *         startDate: "2024-02-01T10:00:00Z"
 *         endDate: "2024-02-05T18:00:00Z"
 *         totalPrice: 12500.50
 *         securityDeposit: 5000
 *         priceBreakdown:
 *           basePrice: 10000.00
 *           days: 4
 *           deliveryFee: 300.00
 *           discountAmount: 1000.00
 *           serviceFee: 450.00
 *           excessMileageFee: 0.00
 *           cancellationFee: 0.00
 *           refundAmount: 0.00
 *         usageLimits:
 *           allowedMileagePerDay: 200
 *           excessMileageFee: 5
 *         odometerReadings:
 *           start: 45000
 *           end: null
 *         status: "confirmed"
 *         paymentStatus: "paid"
 *         paymentTransactionId: "txn_1234567890abcdef"
 *         cancellationReason: null
 *         cancellationPolicy: "moderate"
 *         refundAmount: 0.00
 *         cancellationFee: 0.00
 *         cancelledBy: null
 *         cancelledAt: null
 *         createdAt: "2024-01-15T08:30:00Z"
 *         updatedAt: "2024-01-15T10:45:00Z"
 */
import mongoose, { Schema } from 'mongoose';
import {
  IBookingDocument,
  BookingStatus,
  PaymentStatus,
} from '../types/booking.types.js';

const bookingSchema = new Schema<IBookingDocument>(
  {
    car: {
      type: Schema.Types.ObjectId,
      ref: 'Car',
      required: true,
      index: true,
    },
    listing: {
      type: Schema.Types.ObjectId,
      ref: 'RentalListing',
      required: true,
    },
    renter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (this: IBookingDocument, value: Date) {
          if (!this.startDate) return true;
          return value > this.startDate;
        },
        message: 'End date must be after start date',
      },
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    securityDeposit: {
      type: Number,
      default: 0,
    },
    priceBreakdown: {
      basePrice: { type: Number, required: true },
      days: { type: Number, required: true },
      deliveryFee: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0 },
      serviceFee: { type: Number, default: 0 },
      excessMileageFee: { type: Number, default: 0 },
      cancellationFee: { type: Number, default: 0 },
      refundAmount: { type: Number, default: 0 },
    },

    usageLimits: {
      allowedMileagePerDay: { type: Number, default: null },
      excessMileageFee: { type: Number, default: 0 },
    },

    odometerReadings: {
      start: { type: Number, default: null },
      end: { type: Number, default: null },
    },

    status: {
      type: String,
      enum: Object.values([
        'pending',
        'confirmed',
        'active',
        'completed',
        'cancelled',
        'rejected',
      ] as BookingStatus[]),
      default: 'pending',
      index: true,
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
    },
    paymentTransactionId: {
      type: String,
    },
    cancellationReason: {
      type: String,
    },
    cancellationPolicy: {
      type: String,
      enum: ['flexible', 'moderate', 'strict'],
      default: 'moderate',
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    cancellationFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    cancelledBy: {
      type: String,
      enum: ['renter', 'owner'],
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

bookingSchema.index({ renter: 1, status: 1 });
bookingSchema.index({ owner: 1, status: 1 });
bookingSchema.index({ car: 1, startDate: 1, endDate: 1 });

const Booking = mongoose.model<IBookingDocument>('Booking', bookingSchema);

export default Booking;
