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
