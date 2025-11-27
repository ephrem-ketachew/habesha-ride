/**
 * @swagger
 * components:
 *   schemas:
 *     CarPhoto:
 *       type: object
 *       required:
 *         - url
 *         - publicId
 *       properties:
 *         url:
 *           type: string
 *           description: URL to the photo
 *           example: https://res.cloudinary.com/example/image.jpg
 *         publicId:
 *           type: string
 *           description: Cloudinary public ID
 *           example: cars/car123_photo1
 *         isPrimary:
 *           type: boolean
 *           default: false
 *           description: Whether this is the primary photo
 *
 *     CarLocation:
 *       type: object
 *       required:
 *         - address
 *         - city
 *       properties:
 *         address:
 *           type: string
 *           description: Specific address details
 *           example: Bole, near Edna Mall
 *         city:
 *           type: string
 *           description: City ID (ObjectId reference)
 *           example: 507f1f77bcf86cd799439011
 *
 *     Car:
 *       type: object
 *       required:
 *         - owner
 *         - make
 *         - vehicleModel
 *         - year
 *         - licensePlate
 *         - homeLocation
 *       properties:
 *         _id:
 *           type: string
 *           description: Car ID
 *           example: 507f1f77bcf86cd799439011
 *         owner:
 *           type: string
 *           description: Owner user ID
 *           example: 507f1f77bcf86cd799439011
 *         make:
 *           type: string
 *           description: Make (brand) ID
 *           example: 507f1f77bcf86cd799439012
 *         vehicleModel:
 *           type: string
 *           description: Model ID
 *           example: 507f1f77bcf86cd799439013
 *         year:
 *           type: integer
 *           minimum: 1900
 *           description: Manufacturing year
 *           example: 2022
 *         licensePlate:
 *           type: string
 *           description: License plate number
 *           example: AA-12345
 *         vin:
 *           type: string
 *           description: Vehicle Identification Number
 *           example: 1HGBH41JXMN109186
 *         bodyType:
 *           type: string
 *           enum: [sedan, suv, truck, hatchback, coupe, van, other]
 *           description: Body type of the vehicle
 *           example: sedan
 *         color:
 *           type: string
 *           description: Specific manufacturer color name (e.g., 'Midnight Blue')
 *           example: Midnight Blue
 *         genericColor:
 *           type: string
 *           enum: [Black, White, Silver, Grey, Blue, Red, Brown, Green, Beige, Orange, Gold, Yellow, Purple, Bronze, Burgundy, Other]
 *           description: Generic color category for filtering
 *           example: Blue
 *         transmission:
 *           type: string
 *           enum: [automatic, manual]
 *           description: Transmission type
 *           example: automatic
 *         fuelType:
 *           type: string
 *           enum: [gasoline, diesel, electric, hybrid]
 *           description: Fuel type
 *           example: gasoline
 *         seatingCapacity:
 *           type: integer
 *           minimum: 1
 *           description: Number of seats
 *           example: 5
 *         mileage:
 *           type: number
 *           minimum: 0
 *           description: Current mileage in kilometers
 *           example: 45000
 *         condition:
 *           type: string
 *           enum: [new, excellent, good, fair, poor]
 *           default: good
 *           description: Physical condition of the vehicle
 *           example: good
 *         accidentHistory:
 *           type: boolean
 *           default: false
 *           description: Whether the vehicle has been in any accidents
 *           example: false
 *         usageLevel:
 *           type: string
 *           description: Computed usage level based on mileage and age (virtual field)
 *           example: Moderate Usage
 *         features:
 *           type: array
 *           items:
 *             type: string
 *           description: List of feature IDs (ObjectId references)
 *           example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *         photos:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CarPhoto'
 *           minItems: 1
 *           maxItems: 10
 *         homeLocation:
 *           $ref: '#/components/schemas/CarLocation'
 *         verificationStatus:
 *           type: string
 *           enum: [pending, approved, rejected]
 *           default: pending
 *           description: Verification status by admin
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
import mongoose, { Schema } from 'mongoose';
import mongooseSanitize from 'mongoose-sanitize';
import {
  ICarDocument,
  BodyType,
  CarGenericColor,
  CarCondition,
  TransmissionType,
  FuelType,
  CarVerificationStatus,
} from '../types/car.types.js';

const photoSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false },
);

const locationSchema = new Schema(
  {
    city: {
      type: Schema.Types.ObjectId,
      ref: 'City',
      required: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
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
    color: {
      type: String,
      trim: true,
    },
    genericColor: {
      type: String,
      required: [true, 'Generic color is required for filtering.'],
      enum: Object.values([
        'Black',
        'White',
        'Silver',
        'Grey',
        'Blue',
        'Red',
        'Brown',
        'Green',
        'Beige',
        'Orange',
        'Gold',
        'Yellow',
        'Purple',
        'Bronze',
        'Burgundy',
        'Other',
      ] as CarGenericColor[]),
      index: true,
    },
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
    condition: {
      type: String,
      enum: Object.values(CarCondition),
      default: CarCondition.GOOD,
      index: true,
    },
    accidentHistory: {
      type: Boolean,
      default: false,
    },
    features: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Feature' }],
      validate: {
        validator: (v: any[]) => !v || v.length <= 20,
        message: 'Cannot have more than 20 features.',
      },
    },
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

carSchema.plugin(mongooseSanitize);

carSchema.virtual('rentalListing', {
  ref: 'RentalListing',
  localField: '_id',
  foreignField: 'car',
  justOne: true,
});

carSchema.virtual('saleListing', {
  ref: 'SaleListing',
  localField: '_id',
  foreignField: 'car',
  justOne: true,
});

carSchema.virtual('usageLevel').get(function () {
  const currentYear = new Date().getFullYear();
  const age = currentYear - this.year;
  const mileage = this.mileage || 0;

  if (mileage < 100 && age < 1) {
    return 'New';
  } else if (mileage < 20000 && age < 3) {
    return 'Low Usage';
  } else if (mileage < 100000) {
    return 'Moderate Usage';
  } else {
    return 'Heavily Used';
  }
});

const Car = mongoose.model<ICarDocument>('Car', carSchema);

export default Car;
