import { Document } from 'mongoose';

export interface IMake {
  name: string;
  logoUrl?: string;
}

export interface IMakeDocument extends IMake, Document {}
