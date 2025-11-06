import mongoose, { Schema } from 'mongoose';
import mongooseSanitize from 'mongoose-sanitize';
import {
  ISaleListingDocument,
  SaleStatus,
  VehicleCondition,
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
    condition: {
      type: String,
      enum: {
        values: [
          'new',
          'used_like_new',
          'used_good',
          'used_fair',
        ] as VehicleCondition[],
      },
      required: [true, 'Vehicle condition is required.'],
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
