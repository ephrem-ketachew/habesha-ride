import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid ID format.',
  });

export const createSaleListingSchema = z.object({
  car: objectIdSchema,
  salePrice: z.coerce.number().min(0, 'Sale price cannot be negative'),
  listingDescription: z
    .string()
    .min(1, 'Description is required')
    .max(2000, 'Description cannot exceed 2000 characters'),
});

export const updateSaleListingSchema = z.object({
  salePrice: z.coerce.number().min(0).optional(),
  listingDescription: z.string().max(2000).optional(),
  status: z.enum(['available', 'reserved', 'sold', 'delisted']).optional(),
});

const transmissionEnum = z.enum(['automatic', 'manual']);

export const getSaleListingsQuerySchema = z.object({
  make: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: 'Invalid Make ID format.',
    })
    .optional(),
  model: z.string().optional(),
  transmission: transmissionEnum.optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  city: z.string().optional(),
  search: z.string().optional(),
  isFeatured: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export const getSaleListingIdSchema = z.object({
  id: objectIdSchema,
});

export type CreateSaleListingInput = z.infer<typeof createSaleListingSchema>;

export type UpdateSaleListingInput = z.infer<typeof updateSaleListingSchema>;

export type GetSaleListingsQuery = z.infer<typeof getSaleListingsQuerySchema>;

export const createSaleReservationSchema = z.object({
  listingId: objectIdSchema,
});

export const cancelSaleReservationSchema = z.object({
  reason: z
    .string()
    .min(10, 'Cancellation reason must be at least 10 characters')
    .max(500, 'Cancellation reason cannot exceed 500 characters'),
});

export const confirmSaleReservationSchema = z.object({
  inspectionNotes: z
    .string()
    .max(1000, 'Inspection notes cannot exceed 1000 characters')
    .optional(),
  agreedSettlementMethod: z
    .enum(['bank_transfer', 'cpo', 'cash', 'other'])
    .optional(),
});

export const scheduleInspectionSchema = z.object({
  inspectionDate: z.coerce.date().refine((date) => date > new Date(), {
    message: 'Inspection date must be in the future',
  }),
  inspectionLocation: z
    .string()
    .min(5, 'Location must be at least 5 characters')
    .max(200, 'Location cannot exceed 200 characters'),
  notes: z.string().max(500).optional(),
});

export const completeSaleSchema = z.object({
  settlementMethod: z.enum(['bank_transfer', 'cpo', 'cash', 'other']),
  settlementReference: z.string().optional(),
  transportAuthorityTransferDate: z.coerce.date().optional(),
  notes: z.string().max(500).optional(),
});

export const extendReservationSchema = z.object({
  extensionHours: z.coerce
    .number()
    .min(1, 'Extension must be at least 1 hour')
    .max(48, 'Extension cannot exceed 48 hours')
    .default(24),
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(200, 'Reason cannot exceed 200 characters'),
});

export const getSaleReservationsQuerySchema = z.object({
  status: z
    .enum(['pending', 'confirmed', 'completed', 'cancelled', 'expired'])
    .optional(),
  paymentStatus: z.enum(['pending', 'paid', 'refunded', 'failed']).optional(),
  buyerId: z.string().optional(),
  sellerId: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export const getSaleReservationIdSchema = z.object({
  id: objectIdSchema,
});

export type CreateSaleReservationInput = z.infer<
  typeof createSaleReservationSchema
>;
export type CancelSaleReservationInput = z.infer<
  typeof cancelSaleReservationSchema
>;
export type ConfirmSaleReservationInput = z.infer<
  typeof confirmSaleReservationSchema
>;
export type ScheduleInspectionInput = z.infer<typeof scheduleInspectionSchema>;
export type CompleteSaleInput = z.infer<typeof completeSaleSchema>;
export type ExtendReservationInput = z.infer<typeof extendReservationSchema>;
export type GetSaleReservationsQuery = z.infer<
  typeof getSaleReservationsQuerySchema
>;

export const processManualRefundSchema = z.object({
  refundAmount: z.coerce
    .number()
    .min(0, 'Refund amount cannot be negative')
    .max(1000000, 'Refund amount too large'),
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason cannot exceed 500 characters'),
});

export const assignAgentSchema = z.object({
  agentId: objectIdSchema,
  notes: z.string().max(500).optional(),
});

export const getSaleAnalyticsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('month').optional(),
});

export type ProcessManualRefundInput = z.infer<
  typeof processManualRefundSchema
>;
export type AssignAgentInput = z.infer<typeof assignAgentSchema>;
export type GetSaleAnalyticsInput = z.infer<typeof getSaleAnalyticsSchema>;
