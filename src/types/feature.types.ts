import { Document } from 'mongoose';

export interface IFeature {
  name: string;
  isActive: boolean;
}

export interface IFeatureDocument extends IFeature, Document {}

