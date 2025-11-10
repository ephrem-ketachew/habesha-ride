import { z } from 'zod';
import { sanitizeInput } from '../utils/sanitize.util.js';
import mongoose from 'mongoose';

const bodyTypeEnum = z.enum([
  'sedan',
  'suv',
  'truck',
  'hatchback',
  'coupe',
  'van',
  'other',
]);
const transmissionEnum = z.enum(['automatic', 'manual']);
const fuelTypeEnum = z.enum(['gasoline', 'diesel', 'electric', 'hybrid']);

export const createCarSchema = z
  .object({
    make: z.string().min(1, 'Make is required (should be an ID)'),
    vehicleModel: z.string().min(1, 'Model is required (should be an ID)'),
    year: z.coerce
      .number()
      .min(1900, 'Year must be 1900 or later')
      .max(new Date().getFullYear() + 1, "Year can't be in the future"),
    licensePlate: z.string().min(1, 'License plate is required'),
    address: z.string().min(1, 'Address is required').transform(sanitizeInput),
    city: z.string().min(1, 'City is required').transform(sanitizeInput),

    vin: z.string().optional(),
    bodyType: bodyTypeEnum.optional(),
    color: z.string().transform(sanitizeInput).optional(),
    transmission: transmissionEnum.optional(),
    fuelType: fuelTypeEnum.optional(),
    seatingCapacity: z.coerce
      .number()
      .min(1, 'Must have at least 1 seat')
      .optional(),
    mileage: z.coerce.number().min(0, 'Mileage cannot be negative').optional(),
    features: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((val) => {
        if (val === undefined) return [];
        if (typeof val === 'string') {
          return [sanitizeInput(val)];
        }
        return val.map(sanitizeInput);
      }),
  })
  .transform((data) => {
    const { address, city, ...rest } = data;
    return {
      ...rest,
      homeLocation: {
        address: address,
        city: city,
      },
    };
  });

const objectIdSchema = z.string().refine(
  (val) => {
    return mongoose.Types.ObjectId.isValid(val);
  },
  { message: 'Invalid ID format.' },
);

export const getCarSchema = z.object({
  id: objectIdSchema,
});

export type GetCarParams = z.infer<typeof getCarSchema>;

export const updateCarSchema = z
  .object({
    make: z.string().min(1, 'Make is required (should be an ID)').optional(),
    vehicleModel: z
      .string()
      .min(1, 'Model is required (should be an ID)')
      .optional(),
    year: z.coerce
      .number()
      .min(1900, 'Year must be 1900 or later')
      .max(new Date().getFullYear() + 1, "Year can't be in the future")
      .optional(),
    licensePlate: z.string().min(1, 'License plate is required').optional(),
    address: z
      .string()
      .min(1, 'Address is required')
      .transform(sanitizeInput)
      .optional(),
    city: z
      .string()
      .min(1, 'City is required')
      .transform(sanitizeInput)
      .optional(),
    vin: z.string().optional(),
    bodyType: bodyTypeEnum.optional(),
    color: z.string().transform(sanitizeInput).optional(),
    transmission: transmissionEnum.optional(),
    fuelType: fuelTypeEnum.optional(),
    seatingCapacity: z.coerce
      .number()
      .min(1, 'Must have at least 1 seat')
      .optional(),
    mileage: z.coerce.number().min(0, 'Mileage cannot be negative').optional(),
    features: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((val) => {
        if (val === undefined) return undefined;
        if (typeof val === 'string') {
          return [sanitizeInput(val)];
        }
        return val.map(sanitizeInput);
      }),

    photosToDelete: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((val) => {
        if (val === undefined) return [];
        if (typeof val === 'string') {
          return [val];
        }
        return val;
      }),

    primaryPhoto: z.string().optional(),
  })
  .transform((data) => {
    const { address, city, ...rest } = data;

    const homeLocation =
      address || city
        ? {
            address: address,
            city: city,
          }
        : undefined;

    return {
      ...rest,
      homeLocation: homeLocation,
    };
  });

export type UpdateCarInput = z.infer<typeof updateCarSchema>;

export type CreateCarInput = z.infer<typeof createCarSchema>;
