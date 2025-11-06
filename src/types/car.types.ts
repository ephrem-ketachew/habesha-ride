import { Document, PopulatedDoc } from 'mongoose';
import { IUserDocument } from './user.types.js';
import { IMakeDocument } from './make.types.js';
import { IVehicleModelDocument } from './vehicleModel.types.js';

export type BodyType =
  | 'sedan'
  | 'suv'
  | 'truck'
  | 'hatchback'
  | 'coupe'
  | 'van'
  | 'other';
export type TransmissionType = 'automatic' | 'manual';
export type FuelType = 'gasoline' | 'diesel' | 'electric' | 'hybrid';

export type CarVerificationStatus = 'pending' | 'approved' | 'rejected';

export interface ICarLocation {
  address: string;
  city: string;
}

export interface ICarPhoto {
  url: string;
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
  transmission?: TransmissionType;
  fuelType?: FuelType;
  seatingCapacity?: number;
  mileage?: number;

  features?: string[];
  photos: ICarPhoto[];

  homeLocation: ICarLocation;
  verificationStatus: CarVerificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICarDocument extends ICar, Document {}
