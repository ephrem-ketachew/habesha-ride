import Booking from "../models/booking.model.js";
import Car from "../models/car.model.js";
import {
  AnalyticsDateRange,
  TimeRange,
  UserAnalytics,
} from "../types/analytics.types.js";
import {
  toDateMatch,
  toObjectId,
  groupByPeriod,
  monthsBetween,
} from "../utils/analyticsHelpers.js";

export const getUserAnalytics = async (
  userId: string,
  range: AnalyticsDateRange
): Promise<UserAnalytics> => {
  const timeRange = range.timeRange || TimeRange.MONTHLY;
  const dateMatch = toDateMatch(range);

  const [byStatus, spent, history, carsListed, bookingsReceived, earnings] =
    await Promise.all([
      Booking.aggregate([
        { $match: { renter: toObjectId(userId), ...dateMatch } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      Booking.aggregate([
        {
          $match: {
            renter: toObjectId(userId),
            status: "completed",
            paymentStatus: "paid",
            ...dateMatch,
          },
        },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),

      Booking.aggregate([
        { $match: { renter: toObjectId(userId), ...dateMatch } },
        {
          $group: {
            _id: groupByPeriod(timeRange),
            count: { $sum: 1 },
            total: { $sum: "$totalPrice" },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Car.countDocuments({ owner: userId }),

      Booking.countDocuments({ owner: userId, ...dateMatch }),

      Booking.aggregate([
        {
          $match: {
            owner: toObjectId(userId),
            status: "completed",
            paymentStatus: "paid",
            ...dateMatch,
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $subtract: [
                  "$totalPrice",
                  { $ifNull: ["$priceBreakdown.serviceFee", 0] },
                ],
              },
            },
          },
        },
      ]),
    ]);

  const totalSpent = spent[0]?.total ?? 0;
  const totalBookingsCount = byStatus.reduce(
    (acc, s) => acc + (s.count ?? 0),
    0
  );
  const avg = totalBookingsCount ? totalSpent / totalBookingsCount : 0;

  const totalBookingsObj: Record<string, number> = {};
  byStatus.forEach((s) => (totalBookingsObj[s._id as string] = s.count));

  const bookingFrequency =
    totalBookingsCount /
    monthsBetween(
      range.startDate ?? history[0]?._id,
      range.endDate ?? history.at(-1)?._id
    );

  return {
    totalBookings: totalBookingsObj,
    totalSpent,
    averageBookingValue: Number(avg.toFixed(2)),
    bookingHistoryTrends: history.map((h) => ({
      period: h._id,
      count: h.count,
      total: h.total,
    })),
    carsListed,
    bookingsReceived,
    earnings: earnings[0]?.total ?? 0,
    bookingFrequency: Number(bookingFrequency.toFixed(2)),
  };
};
