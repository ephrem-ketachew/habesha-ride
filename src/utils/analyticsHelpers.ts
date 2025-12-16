
import mongoose from "mongoose";
import { TimeRange } from "../types/analytics.types.js";

export type DateMatch = { createdAt?: { $gte?: Date; $lte?: Date } };

export const toDateMatch = (range?: any) => {
  if (!range?.startDate && !range?.endDate) return {};

  const createdAt: any = {};

  if (range.startDate) {
    createdAt.$gte = new Date(range.startDate);
  }

  if (range.endDate) {
    const end = new Date(range.endDate);
    createdAt.$lte = end;
  }

  return { createdAt };
};


export const periodFormat = (timeRange: TimeRange) => {
  if (timeRange === TimeRange.DAILY) return "%Y-%m-%d";
  if (timeRange === TimeRange.WEEKLY) return "%G-W%V";
  return "%Y-%m";
};

export const groupByPeriod = (timeRange: TimeRange) => ({
  $dateToString: { format: periodFormat(timeRange), date: "$createdAt" },
});

export const safePercent = (num: number, den: number) =>
  den === 0 ? 0 : Number(((num / den) * 100).toFixed(2));

export const monthsBetween = (start?: string, end?: string) => {
  if (!start || !end) return 1;

  const s = new Date(start);
  const e = new Date(end);

  const months =
    (e.getFullYear() - s.getFullYear()) * 12 +
    (e.getMonth() - s.getMonth()) +
    1;

  return Math.max(months, 1);
};


export const toObjectId = (id: string) =>
  mongoose.Types.ObjectId.createFromHexString(id);
