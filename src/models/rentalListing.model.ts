/**
 * @swagger
 * components:
 *   schemas:
 *     RentalListing:
 *       type: object
 *       required:
 *         - car
 *         - owner
 *         - ratePerDay
 *         - listingDescription
 *       properties:
 *         _id:
 *           type: string
 *           description: Rental listing ID
 *           example: 507f1f77bcf86cd799439011
 *         car:
 *           type: string
 *           description: Car ID
 *           example: 507f1f77bcf86cd799439012
 *         owner:
 *           type: string
 *           description: Owner user ID
 *           example: 507f1f77bcf86cd799439013
 *         status:
 *           type: string
 *           enum: [listed, unlisted, paused]
 *           default: listed
 *           description: Listing status
 *         ratePerDay:
 *           type: number
 *           minimum: 0
 *           description: Daily rental rate
 *           example: 2500
 *         ratePerHour:
 *           type: number
 *           minimum: 0
 *           description: Hourly rental rate (optional)
 *           example: 150
 *         securityDeposit:
 *           type: number
 *           minimum: 0
 *           default: 0
 *           description: Amount to be held/authorized during the trip
 *           example: 5000
 *         weeklyDiscountPercent:
 *           type: number
 *           minimum: 0
 *           maximum: 99
 *           default: 0
 *           description: Percentage discount for bookings of 7 days or more
 *           example: 10
 *         monthlyDiscountPercent:
 *           type: number
 *           minimum: 0
 *           maximum: 99
 *           default: 0
 *           description: Percentage discount for bookings of 30 days or more
 *           example: 20
 *         allowedMileagePerDay:
 *           type: number
 *           nullable: true
 *           minimum: 0
 *           description: Maximum kilometers allowed per day. Leave empty for unlimited.
 *           example: 200
 *         excessMileageFee:
 *           type: number
 *           minimum: 0
 *           default: 0
 *           description: Fee per kilometer charged if the user exceeds the limit (required if allowedMileagePerDay is set)
 *           example: 5
 *         advanceNoticeHours:
 *           type: number
 *           minimum: 0
 *           default: 12
 *           description: How many hours in advance a user must book
 *           example: 24
 *         deliveryAvailable:
 *           type: boolean
 *           default: false
 *           description: Whether delivery is available
 *         deliveryFee:
 *           type: number
 *           minimum: 0
 *           description: Delivery fee (required if deliveryAvailable is true)
 *           example: 300
 *         minRentalDurationDays:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           description: Minimum rental duration in days
 *         maxRentalDurationDays:
 *           type: integer
 *           maximum: 365
 *           default: 90
 *           description: Maximum duration for a single booking to prevent indefinite possession
 *         instantBookingAvailable:
 *           type: boolean
 *           default: false
 *           description: If true, bookings are automatically confirmed without owner approval
 *         cancellationPolicy:
 *           type: string
 *           enum: [flexible, moderate, strict]
 *           default: moderate
 *           description: Determines refund rules if a user cancels
 *         listingDescription:
 *           type: string
 *           minLength: 10
 *           maxLength: 2000
 *           description: Description of the rental listing
 *           example: "Well maintained sedan, perfect for city driving"
 *         unavailableRanges:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - startDate
 *               - endDate
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Start date of unavailability
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: End date of unavailability
 *               reason:
 *                 type: string
 *                 enum: [booking, manual_block]
 *                 default: manual_block
 *                 description: Reason for unavailability
 *           description: Date ranges when the car is not available
 *           example: [{"startDate": "2024-01-15T00:00:00Z", "endDate": "2024-01-20T00:00:00Z", "reason": "booking"}]
 *         isFeatured:
 *           type: boolean
 *           default: false
 *           description: Whether this is a featured listing
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
  IRentalListingDocument,
  ListingStatus,
  CancellationPolicy,
} from '../types/rentalListing.types.js';

const rentalListingSchema = new Schema<IRentalListingDocument>(
  {
    car: {
      type: Schema.Types.ObjectId,
      ref: 'Car',
      required: true,
      unique: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(['listed', 'unlisted', 'paused'] as ListingStatus[]),
      default: 'listed',
      index: true,
    },
    ratePerDay: {
      type: Number,
      required: [true, 'Rate per day is required.'],
      min: [0, 'Rate cannot be negative.'],
      index: true,
    },
    ratePerHour: {
      type: Number,
      min: [0, 'Rate cannot be negative.'],
    },
    securityDeposit: {
      type: Number,
      default: 0,
      min: [0, 'Security deposit cannot be negative.'],
    },
    weeklyDiscountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 99,
    },
    monthlyDiscountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 99,
    },
    allowedMileagePerDay: {
      type: Number,
      default: null,
      min: 0,
    },
    excessMileageFee: {
      type: Number,
      default: 0,
      min: 0,
      required: function (this: IRentalListingDocument) {
        return (
          this.allowedMileagePerDay != null && this.allowedMileagePerDay > 0
        );
      },
    },
    advanceNoticeHours: {
      type: Number,
      default: 12,
      min: 0,
    },
    deliveryAvailable: {
      type: Boolean,
      default: false,
    },
    deliveryFee: {
      type: Number,
      min: 0,
      required: function (this: IRentalListingDocument) {
        return this.deliveryAvailable === true;
      },
    },
    minRentalDurationDays: {
      type: Number,
      default: 1,
      min: 1,
    },
    maxRentalDurationDays: {
      type: Number,
      default: 90,
      max: 365,
    },
    instantBookingAvailable: {
      type: Boolean,
      default: false,
      index: true,
    },
    cancellationPolicy: {
      type: String,
      enum: Object.values([
        'flexible',
        'moderate',
        'strict',
      ] as CancellationPolicy[]),
      default: 'moderate',
    },
    listingDescription: {
      type: String,
      required: [true, 'A description is required.'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters.'],
    },
    unavailableRanges: {
      type: [
        {
          startDate: { type: Date, required: true },
          endDate: { type: Date, required: true },
          reason: {
            type: String,
            enum: ['booking', 'manual_block'],
            default: 'manual_block',
          },
        },
      ],
      validate: {
        validator: function (ranges: any[]) {
          return ranges.every(
            (range) =>
              new Date(range.endDate).getTime() >=
              new Date(range.startDate).getTime(),
          );
        },
        message:
          'End date must be greater than or equal to start date for all unavailable ranges.',
      },
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

rentalListingSchema.plugin(mongooseSanitize);

rentalListingSchema.pre('save', function (next) {
  if (
    this.weeklyDiscountPercent != null &&
    this.monthlyDiscountPercent != null
  ) {
    if (this.weeklyDiscountPercent > this.monthlyDiscountPercent) {
      return next(
        new Error(
          'Monthly discount must be greater than or equal to weekly discount.',
        ),
      );
    }
  }
  next();
});

rentalListingSchema.index({ status: 1, ratePerDay: 1 });
rentalListingSchema.index({ owner: 1, status: 1 });
rentalListingSchema.index({ status: 1, instantBookingAvailable: 1 });
rentalListingSchema.index({
  'unavailableRanges.startDate': 1,
  'unavailableRanges.endDate': 1,
});

const RentalListing = mongoose.model<IRentalListingDocument>(
  'RentalListing',
  rentalListingSchema,
);

export default RentalListing;
