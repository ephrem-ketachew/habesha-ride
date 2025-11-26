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

export const getRentalListingsQuerySchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
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
