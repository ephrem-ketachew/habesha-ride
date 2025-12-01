import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid ID format.',
  });

const bookingStatusEnum = z.enum([
  'pending',
  'confirmed',
  'active',
  'completed',
  'cancelled',
  'rejected',
]);

const paymentStatusEnum = z.enum(['pending', 'paid', 'refunded', 'failed']);

export const createBookingSchema = z
  .object({
    listingId: objectIdSchema,
    startDate: z.coerce.date().refine((date) => date > new Date(), {
      message: 'Start date must be in the future',
    }),
    endDate: z.coerce.date(),
    deliveryRequested: z.boolean().optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export const getBookingIdSchema = z.object({
  id: objectIdSchema,
});

export const updateBookingStatusBodySchema = z.object({
  status: z.enum(['confirmed', 'rejected', 'cancelled']),
  cancellationReason: z.string().optional(),
});

export const recordOdometerBodySchema = z.object({
  reading: z.coerce.number().min(0, 'Odometer reading cannot be negative'),
  type: z.enum(['start', 'end']),
});

export const updatePaymentStatusBodySchema = z.object({
  paymentStatus: paymentStatusEnum,
  paymentTransactionId: z.string().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type GetBookingParams = z.infer<typeof getBookingIdSchema>;
export type UpdateBookingStatusInput = z.infer<
  typeof updateBookingStatusBodySchema
>;
export type RecordOdometerInput = z.infer<typeof recordOdometerBodySchema>;
export type UpdatePaymentStatusInput = z.infer<
  typeof updatePaymentStatusBodySchema
>;
