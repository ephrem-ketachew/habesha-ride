import { z } from 'zod';
import { sanitizeInput } from '../utils/sanitize.util.js';

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
      .array(z.string().transform(sanitizeInput))
      .optional()
      .default([]),
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

export type CreateCarInput = z.infer<typeof createCarSchema>;
