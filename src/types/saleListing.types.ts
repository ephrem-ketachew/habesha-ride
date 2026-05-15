import { Document, PopulatedDoc } from 'mongoose';
import { IUserDocument } from './user.types.js';
import { ICarDocument } from './car.types.js';

export type SaleStatus = 'available' | 'reserved' | 'sold' | 'delisted';

export interface ISaleListing {
  car: PopulatedDoc<ICarDocument>;
  owner: PopulatedDoc<IUserDocument>;
  status: SaleStatus;
  salePrice: number;
  listingDescription: string;
  isFeatured: boolean;

  // Reservation fields
  reservedBy?: PopulatedDoc<IUserDocument>;
  reservedAt?: Date;
  reservationExpiresAt?: Date;

  // Sale completion
  soldAt?: Date;

  // Optional negotiation features
  allowNegotiation: boolean;
  minimumOfferPrice?: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface ISaleListingDocument extends ISaleListing, Document {}
