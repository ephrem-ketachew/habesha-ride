import mongoose, { Schema } from 'mongoose';
import mongooseSanitize from 'mongoose-sanitize';
import {
  ICarDocument,
  BodyType,
  TransmissionType,
  FuelType,
  CarVerificationStatus,
} from '../types/car.types.js';

const photoSchema = new Schema(
  {
    url: { type: String, required: true },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false },
);

const locationSchema = new Schema(
  {
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const carSchema = new Schema<ICarDocument>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    make: {
      type: Schema.Types.ObjectId,
      ref: 'Make',
      required: [true, 'Vehicle make is required.'],
    },
    vehicleModel: {
      type: Schema.Types.ObjectId,
      ref: 'VehicleModel',
      required: [true, 'Vehicle model is required.'],
    },
    year: {
      type: Number,
      required: [true, 'Vehicle year is required.'],
      min: [1900, 'Vehicle year must be 1900 or later.'],
      max: [
        new Date().getFullYear() + 1,
        "Vehicle year can't be in the future.",
      ],
    },
    licensePlate: {
      type: String,
      required: [true, 'License plate is required.'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    vin: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    bodyType: {
      type: String,
      enum: Object.values([
        'sedan',
        'suv',
        'truck',
        'hatchback',
        'coupe',
        'van',
        'other',
      ] as BodyType[]),
    },
    color: { type: String, trim: true },
    transmission: {
      type: String,
      enum: Object.values(['automatic', 'manual'] as TransmissionType[]),
    },
    fuelType: {
      type: String,
      enum: Object.values([
        'gasoline',
        'diesel',
        'electric',
        'hybrid',
      ] as FuelType[]),
    },
    seatingCapacity: {
      type: Number,
      min: [1, 'Must have at least 1 seat.'],
    },
    mileage: { type: Number, min: [0, 'Mileage cannot be negative.'] },
    features: { type: [String], trim: true },
    photos: {
      type: [photoSchema],
      validate: {
        validator: (v: any[]) =>
          Array.isArray(v) && v.length > 0 && v.length <= 10,
        message: 'Please upload at least 1 and at most 10 photos.',
      },
    },
    homeLocation: {
      type: locationSchema,
      required: true,
    },
    verificationStatus: {
      type: String,
      enum: Object.values([
        'pending',
        'approved',
        'rejected',
      ] as CarVerificationStatus[]),
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

carSchema.pre('save', function (next) {
  if (this.isModified('features') && this.features) {
    this.features = this.features.map((f) => f.trim());
  }
  next();
});

carSchema.plugin(mongooseSanitize);

carSchema.index({
  make: 'text',
  vehicleModel: 'text',
  'homeLocation.city': 'text',
});

const Car = mongoose.model<ICarDocument>('Car', carSchema);

export default Car;
