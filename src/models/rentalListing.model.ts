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
 *         listingDescription:
 *           type: string
 *           minLength: 10
 *           maxLength: 2000
 *           description: Description of the rental listing
 *           example: "Well maintained sedan, perfect for city driving"
 *         isFeatured:
 *           type: boolean
 *           default: false
 *           description: Whether this is a featured listing
 *         blockedDates:
 *           type: array
 *           items:
 *             type: string
 *             format: date
 *           description: Dates when the car is not available
 *           example: ["2024-01-15", "2024-01-16"]
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
    },
    status: {
      type: String,
      enum: {
        values: ['listed', 'unlisted', 'paused'] as ListingStatus[],
      },
      default: 'listed',
      index: true,
    },
    ratePerDay: {
      type: Number,
      required: [true, 'Rate per day is required.'],
      min: [0, 'Rate cannot be negative.'],
    },
    ratePerHour: {
      type: Number,
      min: [0, 'Rate cannot be negative.'],
    },
    deliveryAvailable: {
      type: Boolean,
      default: false,
    },
    deliveryFee: {
      type: Number,
      min: [0, 'Delivery fee cannot be negative.'],
      required: [
        function (this: IRentalListingDocument) {
          return this.deliveryAvailable === true;
        },
        'Delivery fee is required if delivery is available.',
      ],
    },
    minRentalDurationDays: {
      type: Number,
      default: 1,
      min: [1, 'Minimum duration must be at least 1 day.'],
    },
    listingDescription: {
      type: String,
      required: [true, 'A description is required for the rental.'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters.'],
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    blockedDates: {
      type: [Date],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

rentalListingSchema.plugin(mongooseSanitize);

rentalListingSchema.index({ owner: 1, status: 1 });

rentalListingSchema.index({ status: 1, isFeatured: 1 });

const RentalListing = mongoose.model<IRentalListingDocument>(
  'RentalListing',
  rentalListingSchema,
);

export default RentalListing;
