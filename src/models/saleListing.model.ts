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
 *           enum: [available, pending, sold]
 *           default: available
 *           description: Sale status
 *         salePrice:
 *           type: number
 *           minimum: 0
 *           description: Sale price
 *           example: 450000
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
        values: ['available', 'pending', 'sold'] as SaleStatus[],
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
  },
  {
    timestamps: true,
  },
);

saleListingSchema.plugin(mongooseSanitize);

saleListingSchema.index({ owner: 1, status: 1 });

saleListingSchema.index({ status: 1, isFeatured: 1 });

const SaleListing = mongoose.model<ISaleListingDocument>(
  'SaleListing',
  saleListingSchema,
);

export default SaleListing;
