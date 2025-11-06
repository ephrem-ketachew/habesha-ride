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
