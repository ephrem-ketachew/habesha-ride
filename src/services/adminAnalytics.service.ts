import Booking from '../models/booking.model.js';
import Transaction from '../models/transaction.model.js';
import User from '../models/user.model.js';
import RentalListing from '../models/rentalListing.model.js';
import SaleListing from '../models/saleListing.model.js';

import {
  AdminAnalytics,
  AnalyticsDateRange,
  TimeRange
} from '../types/analytics.types.js';

import {
  toObjectId,
  toDateMatch,
  groupByPeriod,
  safePercent,
} from '../utils/analyticsHelpers.js';

export const getAdminAnalytics = async (
  range: AnalyticsDateRange,
): Promise<AdminAnalytics> => {
  const timeRange = range.timeRange || TimeRange.MONTHLY;
  const dateMatch = toDateMatch(range);

  const [
    usersByRole,
    usersByStatus,
    bookingsByStatus,
    totalRevenueAgg,
    activeRental,
    activeSale,
    revenueTrends,
    serviceFees,
    refunds,
    txnSuccess,
    newRegs,
    verifiedCounts,
    engagementUsers,
    bookingStats,
    popularModels,
    avgDuration,
  ] = await Promise.all([
    
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]),

    User.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),

    Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),

    Booking.aggregate([
      { $match: { status: 'completed', paymentStatus: 'paid', ...dateMatch } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),

    RentalListing.countDocuments({ status: 'listed' }),
    SaleListing.countDocuments({ status: 'available' }),

    Booking.aggregate([
      { $match: { status: 'completed', paymentStatus: 'paid', ...dateMatch } },
      {
        $group: {
          _id: groupByPeriod(timeRange),
          total: { $sum: '$totalPrice' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

 
    Booking.aggregate([
      { $match: { status: 'completed', paymentStatus: 'paid', ...dateMatch } },
      {
        $group: {
          _id: null,
          total: { $sum: '$priceBreakdown.serviceFee' },
        },
      },
    ]),

    Booking.aggregate([
      { $match: { status: 'cancelled', ...dateMatch } },
      { $group: { _id: null, total: { $sum: '$refundAmount' } } },
    ]),

   
    Transaction.aggregate([
      { $match: { ...dateMatch } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),


    User.aggregate([
      { $match: { ...dateMatch } },
      { $group: { _id: groupByPeriod(timeRange), count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),

    User.aggregate([
      {
        $group: {
          _id: null,
          verified: { $sum: { $cond: ['$isEmailVerified', 1, 0] } },
          total: { $sum: 1 },
        },
      },
    ]),


    Booking.aggregate([
      { $match: { ...dateMatch } },
      { $group: { _id: '$renter' } },
    ]),


    Booking.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        },
      },
    ]),

  
    Booking.aggregate([
      { $match: { ...dateMatch } },
      { $lookup: { from: 'cars', localField: 'car', foreignField: '_id', as: 'car' } },
      { $unwind: '$car' },
      { $lookup: { from: 'makes', localField: 'car.make', foreignField: '_id', as: 'make' } },
      { $unwind: '$make' },
      { $lookup: { from: 'vehiclemodels', localField: 'car.vehicleModel', foreignField: '_id', as: 'model' } },
      { $unwind: '$model' },
      {
        $group: {
          _id: { make: '$make.name', model: '$model.name' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),

   
    Booking.aggregate([
      { $match: { status: 'completed', ...dateMatch } },
      { $group: { _id: null, avgDays: { $avg: '$priceBreakdown.days' } } },
    ]),
  ]);


  const overviewRole: Record<string, number> = {};
  usersByRole.forEach(r => (overviewRole[r._id as string] = r.count));

  const overviewStatus: Record<string, number> = {};
  usersByStatus.forEach(r => (overviewStatus[r._id as string] = r.count));

  const bookingsStatus: Record<string, number> = {};
  bookingsByStatus.forEach(r => (bookingsStatus[r._id as string] = r.count));

 
  const totalRevenue = totalRevenueAgg[0]?.total ?? 0;
  const serviceFeesCollected = serviceFees[0]?.total ?? 0;
  const refundsTotal = refunds[0]?.total ?? 0;

 
  const totalTx = txnSuccess.reduce((a, t) => a + t.count, 0);
  const completedTx = txnSuccess.find(t => t._id === 'completed')?.count ?? 0;
  const transactionSuccessRate = safePercent(completedTx, totalTx);

  
  const cumulativeGrowth: { period: string; count: number }[] = [];
  let running = 0;
  newRegs.forEach(p => {
    running += p.count;
    cumulativeGrowth.push({ period: p._id, count: running });
  });


  const verified = verifiedCounts[0]?.verified ?? 0;
  const totalUsers = verifiedCounts[0]?.total ?? 0;
  const verificationPercent = safePercent(verified, totalUsers);


  const activeUsers = engagementUsers.length;
  const userEngagementPercent = safePercent(activeUsers, totalUsers);

  
  const totalBookings = bookingStats[0]?.total ?? 0;
  const completedBookings = bookingStats[0]?.completed ?? 0;
  const cancelledBookings = bookingStats[0]?.cancelled ?? 0;

  const completionRate = safePercent(completedBookings, totalBookings);
  const cancellationRate = safePercent(cancelledBookings, totalBookings);

  
  return {
    overview: {
      totalUsers: overviewRole,
      totalUsersByStatus: overviewStatus,
      totalBookings: bookingsStatus,
      totalRevenue,
      activeListings: activeRental + activeSale,
    },

    financial: {
      revenueTrends: revenueTrends.map(r => ({
        period: r._id,
        count: r.count,
        total: r.total,
      })),
      serviceFeesCollected,
      refunds: refundsTotal,
      transactionSuccessRate,
    },

    userInsights: {
      newRegistrations: newRegs.map(r => ({ period: r._id, count: r.count })),
      userGrowth: cumulativeGrowth,
      verificationRates: {
        verified,
        total: totalUsers,
        percent: verificationPercent,
      },
      userEngagement: {
        activeUsers,
        totalUsers,
        percent: userEngagementPercent,
      },
    },

    bookingInsights: {
      completionRate,
      cancellationRate,
      popularMakesModels: popularModels.map(p => ({
        make: p._id.make,
        model: p._id.model,
        count: p.count,
      })),
      averageBookingDuration: Number((avgDuration[0]?.avgDays ?? 0).toFixed(2)),
    },
  };
};
