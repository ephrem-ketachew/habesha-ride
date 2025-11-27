import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid ID format.',
  });


export const createSaleListingSchema = z.object({
  car: objectIdSchema,
  salePrice: z
    .coerce
    .number()
    .min(0, 'Sale price cannot be negative'),
  listingDescription: z
    .string()
    .min(1, 'Description is required')
    .max(2000, 'Description cannot exceed 2000 characters'),
});


export const updateSaleListingSchema = z.object({
  salePrice: z.coerce.number().min(0).optional(),
  listingDescription: z.string().max(2000).optional(),
  status: z.enum(['available', 'pending', 'sold']).optional(),
});


export const getSaleListingsQuerySchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  city: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});


export const getSaleListingIdSchema = z.object({
  id: objectIdSchema,
});

export type CreateSaleListingInput = z.infer<
  typeof createSaleListingSchema
>;

export type UpdateSaleListingInput = z.infer<
  typeof updateSaleListingSchema
>;

export type GetSaleListingsQuery = z.infer<
  typeof getSaleListingsQuerySchema
>;
