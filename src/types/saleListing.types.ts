import { Document, PopulatedDoc } from 'mongoose';
import { IUserDocument } from './user.types.js';
import { ICarDocument } from './car.types.js';

export type SaleStatus = 'available' | 'pending' | 'sold';

export interface ISaleListing {
  car: PopulatedDoc<ICarDocument>;
  owner: PopulatedDoc<IUserDocument>;
  status: SaleStatus;
  salePrice: number;
  listingDescription: string;
  isFeatured: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface ISaleListingDocument extends ISaleListing, Document {}
