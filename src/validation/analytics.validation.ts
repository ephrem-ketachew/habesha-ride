import z from 'zod';
import { TimeRange } from '../types/analytics.types.js';

const dateSchema = z
  .string()
  .datetime()
  .optional();

const timeRangeSchema = z.nativeEnum(TimeRange).optional();

export const getAnalyticsSchema = z
  .object({
    startDate: dateSchema,
    endDate: dateSchema,
    timeRange: timeRangeSchema.default(TimeRange.MONTHLY),
  })
  .refine(
    (v) => !(v.startDate && v.endDate) || new Date(v.startDate) < new Date(v.endDate),
    { message: 'startDate must be before endDate', path: ['endDate'] },
  );

export const getUserAnalyticsSchema = getAnalyticsSchema;
export const getAdminAnalyticsSchema = getAnalyticsSchema;