export enum TimeRange {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export interface AnalyticsDateRange {
  startDate?: string; 
  endDate?: string;   
  timeRange?: TimeRange;
}


export interface UserBookingsByStatus {
  pending?: number;
  confirmed?: number;
  active?: number;
  completed?: number;
  cancelled?: number;
  rejected?: number;
  [key: string]: number | undefined;
}

export interface TimeSeriesPoint {
  period: string; 
  count: number;
  total?: number;
}

export interface UserAnalytics {
  totalBookings: UserBookingsByStatus;
  totalSpent: number;
  averageBookingValue: number;
  bookingHistoryTrends: TimeSeriesPoint[];
  carsListed?: number;
  bookingsReceived?: number;
  earnings?: number;
  bookingFrequency?: number; 
}


export interface RoleCounts { [role: string]: number }
export interface StatusCounts { [status: string]: number }

export interface PlatformOverview {
  totalUsers: RoleCounts;
  totalUsersByStatus: StatusCounts;
  totalBookings: StatusCounts;
  totalRevenue: number;
  activeListings: number;
}

export interface FinancialMetrics {
  revenueTrends: TimeSeriesPoint[];
  serviceFeesCollected: number;
  refunds: number;
  transactionSuccessRate: number; 
}

export interface UserInsights {
  newRegistrations: TimeSeriesPoint[];
  userGrowth: TimeSeriesPoint[]; 
  verificationRates: { verified: number; total: number; percent: number };
  userEngagement: { activeUsers: number; totalUsers: number; percent: number };
}

export interface BookingInsights {
  completionRate: number;
  cancellationRate: number;
  popularMakesModels: { make: string; model?: string; count: number }[];
  averageBookingDuration: number; 
}

export interface AdminAnalytics {
  overview: PlatformOverview;
  financial: FinancialMetrics;
  userInsights: UserInsights;
  bookingInsights: BookingInsights;
}