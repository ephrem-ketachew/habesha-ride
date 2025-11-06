import { Document, PopulatedDoc } from 'mongoose';
import { IUserDocument } from './user.types.js';
import { ICarDocument } from './car.types.js';

export type ListingStatus = 'listed' | 'unlisted' | 'paused';

export interface IRentalListing {
  car: PopulatedDoc<ICarDocument>;
  owner: PopulatedDoc<IUserDocument>;
  status: ListingStatus;
  ratePerDay: number;
  ratePerHour?: number;
  deliveryAvailable: boolean;
  deliveryFee?: number;
  minRentalDurationDays: number;
  isFeatured: boolean;

  blockedDates: Date[];

  createdAt: Date;
  updatedAt: Date;
}

export interface IRentalListingDocument extends IRentalListing, Document {}
