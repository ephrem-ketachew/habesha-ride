import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid ID format.',
  });

const unavailableRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.enum(['booking', 'manual_block']).optional().default('manual_block'),
}).refine(
  (data) => data.endDate.getTime() >= data.startDate.getTime(),
  {
    message: 'End date must be greater than or equal to start date.',
    path: ['endDate'],
  },
);

export const createRentalListingSchema = z
  .object({
    car: objectIdSchema,
    ratePerDay: z.coerce.number().min(0, 'Rate cannot be negative'),
    ratePerHour: z.coerce.number().min(0).optional(),
    securityDeposit: z.coerce.number().min(0).optional().default(0),
    weeklyDiscountPercent: z.coerce.number().min(0).max(99).optional().default(0),
    monthlyDiscountPercent: z.coerce.number().min(0).max(99).optional().default(0),
    allowedMileagePerDay: z.coerce.number().min(0).nullable().optional(),
    excessMileageFee: z.coerce.number().min(0).optional().default(0),
    advanceNoticeHours: z.coerce.number().min(0).optional().default(12),
    deliveryAvailable: z.coerce.boolean().optional().default(false),
    deliveryFee: z.coerce.number().min(0).optional(),
    minRentalDurationDays: z.coerce.number().min(1).optional().default(1),
    maxRentalDurationDays: z.coerce.number().max(365).optional().default(90),
    instantBookingAvailable: z.coerce.boolean().optional().default(false),
    cancellationPolicy: z.enum(['flexible', 'moderate', 'strict']).optional().default('moderate'),
    listingDescription: z
      .string()
      .min(10, 'Description is too short')
      .max(2000),
    unavailableRanges: z.array(unavailableRangeSchema).optional().default([]),
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
  )
  .refine(
    (data) => {
      if (data.allowedMileagePerDay != null && data.allowedMileagePerDay > 0) {
        return data.excessMileageFee !== undefined && data.excessMileageFee >= 0;
      }
      return true;
    },
    {
      message: 'Excess mileage fee is required when allowed mileage per day is set.',
      path: ['excessMileageFee'],
    },
  )
  .refine(
    (data) => {
      if (
        data.weeklyDiscountPercent != null &&
        data.monthlyDiscountPercent != null
      ) {
        return data.monthlyDiscountPercent >= data.weeklyDiscountPercent;
      }
      return true;
    },
    {
      message:
        'Monthly discount must be greater than or equal to weekly discount.',
      path: ['monthlyDiscountPercent'],
    },
  );

export const updateRentalListingSchema = z
  .object({
    status: z.enum(['listed', 'unlisted', 'paused']).optional(),
    ratePerDay: z.coerce.number().min(0).optional(),
    ratePerHour: z.coerce.number().min(0).optional(),
    securityDeposit: z.coerce.number().min(0).optional(),
    weeklyDiscountPercent: z.coerce.number().min(0).max(99).optional(),
    monthlyDiscountPercent: z.coerce.number().min(0).max(99).optional(),
    allowedMileagePerDay: z.coerce.number().min(0).nullable().optional(),
    excessMileageFee: z.coerce.number().min(0).optional(),
    advanceNoticeHours: z.coerce.number().min(0).optional(),
    deliveryAvailable: z.coerce.boolean().optional(),
    deliveryFee: z.coerce.number().min(0).optional(),
    minRentalDurationDays: z.coerce.number().min(1).optional(),
    maxRentalDurationDays: z.coerce.number().max(365).optional(),
    instantBookingAvailable: z.coerce.boolean().optional(),
    cancellationPolicy: z.enum(['flexible', 'moderate', 'strict']).optional(),
    listingDescription: z.string().min(10).max(2000).optional(),
    unavailableRanges: z.array(unavailableRangeSchema).optional(),
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
  )
  .refine(
    (data) => {
      if (data.allowedMileagePerDay != null && data.allowedMileagePerDay > 0) {
        return data.excessMileageFee !== undefined && data.excessMileageFee >= 0;
      }
      return true;
    },
    {
      message: 'Excess mileage fee is required when allowed mileage per day is set.',
      path: ['excessMileageFee'],
    },
  )
  .refine(
    (data) => {
      if (
        data.weeklyDiscountPercent != null &&
        data.monthlyDiscountPercent != null
      ) {
        return data.monthlyDiscountPercent >= data.weeklyDiscountPercent;
      }
      return true;
    },
    {
      message:
        'Monthly discount must be greater than or equal to weekly discount.',
      path: ['monthlyDiscountPercent'],
    },
  );

const bodyTypeEnum = z.enum([
  'sedan',
  'suv',
  'truck',
  'hatchback',
  'coupe',
  'van',
  'other',
]);

const transmissionEnum = z.enum(['automatic', 'manual']);

const fuelTypeEnum = z.enum(['gasoline', 'diesel', 'electric', 'hybrid']);

const genericColorEnum = z.enum([
  'Black',
  'White',
  'Silver',
  'Grey',
  'Blue',
  'Red',
  'Brown',
  'Green',
  'Beige',
  'Orange',
  'Gold',
  'Yellow',
  'Purple',
  'Bronze',
  'Burgundy',
  'Other',
]);

const conditionEnum = z.enum(['new', 'excellent', 'good', 'fair', 'poor']);

export const getRentalListingsQuerySchema = z.object({
  make: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: 'Invalid Make ID format.',
    })
    .optional(),
  model: z.string().optional(),
  bodyType: bodyTypeEnum.optional(),
  transmission: transmissionEnum.optional(),
  fuelType: fuelTypeEnum.optional(),
  genericColor: genericColorEnum.optional(),
  condition: conditionEnum.optional(),
  minSeats: z.coerce.number().min(1).optional(),
  minYear: z.coerce.number().min(1900).optional(),
  maxYear: z.coerce.number().optional(),
  deliveryAvailable: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (typeof val === 'boolean') return val;
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
  features: z
    .union([
      z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: 'Invalid Feature ID format.',
      }),
      z
        .array(
          z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
            message: 'Invalid Feature ID format.',
          }),
        )
        .min(1),
    ])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (typeof val === 'string') return [val];
      return val;
    }),
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
