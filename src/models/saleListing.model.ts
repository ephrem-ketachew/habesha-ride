/**
 * @swagger
 * components:
 *   schemas:
 *     SaleListing:
 *       type: object
 *       required:
 *         - car
 *         - owner
 *         - salePrice
 *         - listingDescription
 *       properties:
 *         _id:
 *           type: string
 *           description: Sale listing ID
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
 *           enum: [available, reserved, sold, delisted]
 *           default: available
 *           description: Sale status (available, reserved during 48h hold, sold when completed, delisted if removed)
 *         salePrice:
 *           type: number
 *           minimum: 0
 *           description: Sale price in ETB
 *           example: 1500000
 *         listingDescription:
 *           type: string
 *           minLength: 10
 *           maxLength: 2000
 *           description: Description of the sale listing
 *           example: "Well-maintained vehicle with complete service history"
 *         isFeatured:
 *           type: boolean
 *           default: false
 *           description: Whether this is a featured listing
 *         reservedBy:
 *           type: string
 *           description: User ID who reserved the car (only if status is reserved)
 *           example: 507f1f77bcf86cd799439014
 *         reservedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when car was reserved
 *         reservationExpiresAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when reservation expires (typically 48 hours after reservedAt)
 *         soldAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when car was sold
 *         allowNegotiation:
 *           type: boolean
 *           default: false
 *           description: Whether seller allows price negotiation (future feature)
 *         minimumOfferPrice:
 *           type: number
 *           minimum: 0
 *           description: Minimum acceptable offer price if negotiation is allowed (future feature)
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
  ISaleListingDocument,
  SaleStatus,
} from '../types/saleListing.types.js';

const saleListingSchema = new Schema<ISaleListingDocument>(
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
        values: ['available', 'reserved', 'sold', 'delisted'] as SaleStatus[],
      },
      default: 'available',
      index: true,
    },
    salePrice: {
      type: Number,
      required: [true, 'Sale price is required.'],
      min: [0, 'Price cannot be negative.'],
    },
    listingDescription: {
      type: String,
      required: [true, 'A description is required for the sale.'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters.'],
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    reservedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    reservedAt: {
      type: Date,
      default: null,
    },
    reservationExpiresAt: {
      type: Date,
      default: null,
      index: true,
    },

    soldAt: {
      type: Date,
      default: null,
    },

    allowNegotiation: {
      type: Boolean,
      default: false,
    },
    minimumOfferPrice: {
      type: Number,
      min: [0, 'Minimum offer price cannot be negative.'],
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

saleListingSchema.plugin(mongooseSanitize);

saleListingSchema.index({ owner: 1, status: 1 });

saleListingSchema.index({ status: 1, isFeatured: 1 });
saleListingSchema.index({ reservedBy: 1, status: 1 });
saleListingSchema.index({ status: 1, reservationExpiresAt: 1 });

const SaleListing = mongoose.model<ISaleListingDocument>(
  'SaleListing',
  saleListingSchema,
);

export default SaleListing;
