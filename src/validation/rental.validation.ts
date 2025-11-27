import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid ID format.',
  });

export const createRentalListingSchema = z
  .object({
    car: objectIdSchema,
    ratePerDay: z.coerce.number().min(0, 'Rate cannot be negative'),
    ratePerHour: z.coerce.number().min(0).optional(),
    deliveryAvailable: z.boolean().optional().default(false),
    deliveryFee: z.coerce.number().min(0).optional(),
    minRentalDurationDays: z.coerce.number().min(1).optional().default(1),
    listingDescription: z
      .string()
      .min(10, 'Description is too short')
      .max(2000),
  })
  .refine(
    (data) => {
      if (data.deliveryAvailable) {
        return data.deliveryFee !== undefined && data.deliveryFee >= 0;
      }
      return true;
    },
    {
      message: 'Delivery fee is required when delivery is available.',
      path: ['deliveryFee'],
    },
  );

export const updateRentalListingSchema = z
  .object({
    status: z.enum(['listed', 'unlisted', 'paused']).optional(),
    ratePerDay: z.coerce.number().min(0).optional(),
    ratePerHour: z.coerce.number().min(0).optional(),
    deliveryAvailable: z.boolean().optional(),
    deliveryFee: z.coerce.number().min(0).optional(),
    minRentalDurationDays: z.coerce.number().min(1).optional(),
    listingDescription: z.string().min(10).max(2000).optional(),
  })
  .refine(
    (data) => {
      if (data.deliveryAvailable === true) {
        return data.deliveryFee !== undefined && data.deliveryFee >= 0;
      }
      return true;
    },
    {
      message: 'Delivery fee is required when enabling delivery.',
      path: ['deliveryFee'],
    },
  );

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

const genericColorEnum = z.enum([
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
]);

const conditionEnum = z.enum(['new', 'excellent', 'good', 'fair', 'poor']);

export const getRentalListingsQuerySchema = z.object({
  make: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: 'Invalid Make ID format.',
    })
    .optional(),
  model: z.string().optional(),
  bodyType: bodyTypeEnum.optional(),
  transmission: transmissionEnum.optional(),
  fuelType: fuelTypeEnum.optional(),
  genericColor: genericColorEnum.optional(),
  condition: conditionEnum.optional(),
  minSeats: z.coerce.number().min(1).optional(),
  minYear: z.coerce.number().min(1900).optional(),
  maxYear: z.coerce.number().optional(),
  deliveryAvailable: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (typeof val === 'boolean') return val;
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
  features: z
    .union([
      z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: 'Invalid Feature ID format.',
      }),
      z
        .array(
          z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
            message: 'Invalid Feature ID format.',
          }),
        )
        .min(1),
    ])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (typeof val === 'string') return [val];
      return val;
    }),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  city: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export type CreateRentalListingInput = z.infer<
  typeof createRentalListingSchema
>;

export type UpdateRentalListingInput = z.infer<
  typeof updateRentalListingSchema
>;

export type GetRentalListingsQuery = z.infer<
  typeof getRentalListingsQuerySchema
>;

export const getRentalListingIdSchema = z.object({
  id: objectIdSchema,
});
