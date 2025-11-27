import { Document } from 'mongoose';

export interface ICity {
  name: string;
  region: string;
  isActive: boolean;
}

export interface ICityDocument extends ICity, Document {}

