import { z } from 'zod';
import mongoose from 'mongoose';

export const faydaCallbackSchema = z
  .object({
    code: z.string().min(1, 'Authorization code is required'),
    state: z.string().min(1, 'State token is required'),
  })
  .strict();

export type FaydaCallbackInput = z.infer<typeof faydaCallbackSchema>;

const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid user ID format',
  });

export const revokePassportVerificationParamsSchema = z.object({
  userId: objectIdSchema,
});

export const getVerificationStatusQuerySchema = z
  .object({
    includePassport: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
    includeFayda: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
  })
  .strict()
  .optional();

export type RevokePassportVerificationParams = z.infer<
  typeof revokePassportVerificationParamsSchema
>;
export type GetVerificationStatusQuery = z.infer<
  typeof getVerificationStatusQuerySchema
>;
