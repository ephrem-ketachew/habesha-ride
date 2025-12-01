import { Document, PopulatedDoc } from 'mongoose';
import { IUserDocument } from './user.types.js';
import { ICarDocument } from './car.types.js';

export type ListingStatus = 'listed' | 'unlisted' | 'paused';

export type CancellationPolicy = 'flexible' | 'moderate' | 'strict';

export type UnavailableReason = 'booking' | 'manual_block';

export interface IUnavailableRange {
  startDate: Date;
  endDate: Date;
  reason: UnavailableReason;
}

export interface IRentalListing {
  car: PopulatedDoc<ICarDocument>;
  owner: PopulatedDoc<IUserDocument>;
  status: ListingStatus;
  ratePerDay: number;
  ratePerHour?: number;
  securityDeposit: number;
  weeklyDiscountPercent: number;
  monthlyDiscountPercent: number;
  allowedMileagePerDay: number | null;
  excessMileageFee: number;
  advanceNoticeHours: number;
  deliveryAvailable: boolean;
  deliveryFee?: number;
  minRentalDurationDays: number;
  maxRentalDurationDays: number;
  instantBookingAvailable: boolean;
  cancellationPolicy: CancellationPolicy;
  listingDescription: string;
  unavailableRanges: IUnavailableRange[];
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRentalListingDocument extends IRentalListing, Document {}
