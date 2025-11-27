import { Document, PopulatedDoc, Types } from 'mongoose';
import { IUserDocument } from './user.types.js';
import { IMakeDocument } from './make.types.js';
import { IVehicleModelDocument } from './vehicleModel.types.js';
import { ICityDocument } from './city.types.js';
import { IFeatureDocument } from './feature.types.js';

export type BodyType =
  | 'sedan'
  | 'suv'
  | 'truck'
  | 'hatchback'
  | 'coupe'
  | 'van'
  | 'other';

export type CarGenericColor =
  | 'Black'
  | 'White'
  | 'Silver'
  | 'Grey'
  | 'Blue'
  | 'Red'
  | 'Brown'
  | 'Green'
  | 'Beige'
  | 'Orange'
  | 'Gold'
  | 'Yellow'
  | 'Purple'
  | 'Bronze'
  | 'Burgundy'
  | 'Other';

export type TransmissionType = 'automatic' | 'manual';
export type FuelType = 'gasoline' | 'diesel' | 'electric' | 'hybrid';

export enum CarCondition {
  NEW = 'new',
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

export type CarVerificationStatus = 'pending' | 'approved' | 'rejected';

export interface ICarLocation {
  city: Types.ObjectId | ICityDocument | string;
  address: string;
}

export interface ICarPhoto {
  url: string;
  publicId: string;
  isPrimary: boolean;
}

export interface ICar {
  owner: PopulatedDoc<IUserDocument>;
  make: PopulatedDoc<IMakeDocument>;
  vehicleModel: PopulatedDoc<IVehicleModelDocument>;
  year: number;
  licensePlate: string;
  vin?: string;

  bodyType?: BodyType;
  color?: string;
  genericColor: CarGenericColor;
  transmission?: TransmissionType;
  fuelType?: FuelType;
  seatingCapacity?: number;
  mileage?: number;
  condition: CarCondition;
  accidentHistory: boolean;

  features?: Array<Types.ObjectId | IFeatureDocument>;
  photos: ICarPhoto[];

  homeLocation: ICarLocation;
  verificationStatus: CarVerificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICarDocument extends ICar, Document {}
