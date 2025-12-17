import { z } from 'zod';
import { ListingStatus } from '../types/rentalListing.types.js';
import { UserRole, UserStatus } from '../types/user.types.js';
import { SaleStatus } from '../types/saleListing.types.js';
import mongoose from 'mongoose';

export const updateCarStatusSchema = z.object({
  status: z.enum(['approved', 'rejected'], {
    message: 'Status is required (approved or rejected)',
  }),
});

export type UpdateCarStatusInput = z.infer<typeof updateCarStatusSchema>;

export const getCarsAdminSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['user', 'admin', 'superadmin'], {
    message: 'Role is required',
  }),
});

export const getUsersAdminSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['user', 'admin', 'superadmin']).optional(),
  status: z.enum(['pending', 'approved', 'blocked']).optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(
    ['pending', 'approved', 'blocked'] as [UserStatus, ...UserStatus[]],
    {
      message: 'Status is required',
    },
  ),
});

export const getListingsAdminSchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export const updateRentalListingStatusAdminSchema = z.object({
  status: z.enum(
    ['listed', 'unlisted', 'paused'] as [ListingStatus, ...ListingStatus[]],
    {
      message: 'Status is required',
    },
  ),
});

export const updateSaleListingStatusAdminSchema = z.object({
  status: z.enum(
    ['available', 'pending', 'sold'] as [SaleStatus, ...SaleStatus[]],
    {
      message: 'Status is required',
    },
  ),
});

export const getBookingsAdminSchema = z.object({
  status: z
    .enum(['pending', 'confirmed', 'active', 'completed', 'cancelled', 'rejected'])
    .optional(),
  paymentStatus: z.enum(['pending', 'paid', 'refunded', 'failed']).optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export const createMakeSchema = z.object({
  name: z.string().min(1, 'Make name is required').trim(),
  logoUrl: z.string().url().optional(),
});

export const updateMakeSchema = z.object({
  name: z.string().min(1).trim().optional(),
  logoUrl: z.string().url().optional(),
});

export const createModelSchema = z.object({
  name: z.string().min(1, 'Model name is required').trim(),
  make: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid Make ID format.',
  }),
});

export const updateModelSchema = z.object({
  name: z.string().min(1).trim().optional(),
});

export type UpdateModelInput = z.infer<typeof updateModelSchema>;

export type CreateMakeInput = z.infer<typeof createMakeSchema>;

export type UpdateMakeInput = z.infer<typeof updateMakeSchema>;

export type CreateModelInput = z.infer<typeof createModelSchema>;

export type GetListingsAdminQuery = z.infer<typeof getListingsAdminSchema>;
export type GetBookingsAdminQuery = z.infer<typeof getBookingsAdminSchema>;

export type UpdateRentalListingStatusAdminInput = z.infer<
  typeof updateRentalListingStatusAdminSchema
>;
export type UpdateSaleListingStatusAdminInput = z.infer<
  typeof updateSaleListingStatusAdminSchema
>;

export type GetUsersAdminQuery = z.infer<typeof getUsersAdminSchema>;

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

export type GetCarsAdminQuery = z.infer<typeof getCarsAdminSchema>;
