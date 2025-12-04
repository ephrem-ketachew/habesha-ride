import { Document, PopulatedDoc } from 'mongoose';
import { IUserDocument } from './user.types.js';
import { ICarDocument } from './car.types.js';
import { IRentalListingDocument } from './rentalListing.types.js';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export interface IPriceBreakdown {
  basePrice: number;
  days: number;
  deliveryFee: number;
  discountAmount: number;
  serviceFee: number;
  excessMileageFee: number;
  cancellationFee?: number;
  refundAmount?: number;
}

export interface IUsageLimits {
  allowedMileagePerDay: number | null;
  excessMileageFee: number;
}

export interface IOdometerReadings {
  start: number | null;
  end: number | null;
}

export type CancellationPolicy = 'flexible' | 'moderate' | 'strict';

export interface IBooking {
  car: PopulatedDoc<ICarDocument>;
  listing: PopulatedDoc<IRentalListingDocument>;
  renter: PopulatedDoc<IUserDocument>;
  owner: PopulatedDoc<IUserDocument>;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  securityDeposit: number;
  priceBreakdown: IPriceBreakdown;
  usageLimits: IUsageLimits;
  odometerReadings: IOdometerReadings;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentTransactionId?: string;
  cancellationReason?: string;
  cancellationPolicy: CancellationPolicy;
  refundAmount?: number;
  cancellationFee?: number;
  cancelledBy?: 'renter' | 'owner';
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBookingDocument extends IBooking, Document {}
