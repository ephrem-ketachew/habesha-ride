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

export type RevokePassportVerificationParams = z.infer<
  typeof revokePassportVerificationParamsSchema
>;

export const licenseVerificationBodySchema = z.object({
  licenseType: z.enum(['ethiopian', 'international'], {
    message:
      'License type is required and must be either "ethiopian" or "international"',
  }),
});

export const revokeLicenseVerificationParamsSchema = z.object({
  userId: objectIdSchema,
});

export type LicenseVerificationBody = z.infer<
  typeof licenseVerificationBodySchema
>;
export type RevokeLicenseVerificationParams = z.infer<
  typeof revokeLicenseVerificationParamsSchema
>;

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
    includeLicense: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
  })
  .strict()
  .optional();

export type GetVerificationStatusQuery = z.infer<
  typeof getVerificationStatusQuerySchema
>;
