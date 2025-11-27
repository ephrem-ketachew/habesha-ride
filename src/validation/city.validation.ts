import { z } from 'zod';
import mongoose from 'mongoose';

export const getCitiesSchema = z.object({
  region: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'region']).optional().default('name'),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
});

export const getCitySchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid City ID format.',
  }),
});

export const createCitySchema = z.object({
  name: z.string().min(1, 'City name is required').trim(),
  region: z.string().min(1, 'Region is required').trim(),
  isActive: z.boolean().optional().default(true),
});

export const updateCitySchema = z.object({
  name: z.string().min(1).trim().optional(),
  region: z.string().min(1).trim().optional(),
  isActive: z.boolean().optional(),
});

export type GetCitiesQuery = z.infer<typeof getCitiesSchema>;
export type GetCityParams = z.infer<typeof getCitySchema>;
export type CreateCityInput = z.infer<typeof createCitySchema>;
export type UpdateCityInput = z.infer<typeof updateCitySchema>;

