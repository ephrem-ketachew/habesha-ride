import { Document, PopulatedDoc } from 'mongoose';
import { IMakeDocument } from './make.types.js';

export interface IVehicleModel {
  name: string;
  make: PopulatedDoc<IMakeDocument>;
}

export interface IVehicleModelDocument extends IVehicleModel, Document {}
