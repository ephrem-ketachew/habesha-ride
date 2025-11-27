import { z } from 'zod';
import mongoose from 'mongoose';

export const getFeaturesSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
});

export const getFeatureSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid Feature ID format.',
  }),
});

export const createFeatureSchema = z.object({
  name: z.string().min(1, 'Feature name is required').trim(),
  isActive: z.boolean().optional().default(true),
});

export const updateFeatureSchema = z.object({
  name: z.string().min(1).trim().optional(),
  isActive: z.boolean().optional(),
});

export type GetFeaturesQuery = z.infer<typeof getFeaturesSchema>;
export type GetFeatureParams = z.infer<typeof getFeatureSchema>;
export type CreateFeatureInput = z.infer<typeof createFeatureSchema>;
export type UpdateFeatureInput = z.infer<typeof updateFeatureSchema>;
