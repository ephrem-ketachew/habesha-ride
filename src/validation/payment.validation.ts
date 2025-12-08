import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid ID format',
  });

export const initializePaymentSchema = z.object({
  bookingId: objectIdSchema,
});

export const verifyPaymentSchema = z.object({
  tx_ref: z.string().min(1, 'Transaction reference is required'),
});

export const getTransactionsByBookingSchema = z.object({
  bookingId: objectIdSchema,
});

export const getTransactionSchema = z.object({
  transactionId: objectIdSchema,
});

export const refundPaymentParamsSchema = z.object({
  transactionId: objectIdSchema,
});

export const refundPaymentBodySchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
});

export const adminTransactionFiltersSchema = z.object({
  status: z
    .enum([
      'pending',
      'processing',
      'completed',
      'failed',
      'cancelled',
      'refund_pending',
      'refunded',
      'refund_failed',
    ])
    .optional(),
  type: z.enum(['payment', 'refund', 'deposit', 'excess']).optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50)),
  skip: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0)),
});

export type InitializePaymentInput = z.infer<typeof initializePaymentSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type GetTransactionsByBookingInput = z.infer<
  typeof getTransactionsByBookingSchema
>;
export type GetTransactionInput = z.infer<typeof getTransactionSchema>;
export type RefundPaymentParamsInput = z.infer<
  typeof refundPaymentParamsSchema
>;
export type RefundPaymentBodyInput = z.infer<typeof refundPaymentBodySchema>;
export type AdminTransactionFiltersInput = z.infer<
  typeof adminTransactionFiltersSchema
>;
