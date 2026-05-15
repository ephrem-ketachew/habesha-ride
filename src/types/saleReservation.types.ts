import mongoose, { Document, PopulatedDoc } from 'mongoose';
import { IUserDocument } from './user.types.js';
import { ICarDocument } from './car.types.js';
import { ISaleListingDocument } from './saleListing.types.js';

export type ReservationStatus =
  | 'pending' // Payment received, awaiting inspection
  | 'confirmed' // Inspection scheduled/completed, proceeding to sale
  | 'completed' // Final settlement done, ownership transferred
  | 'cancelled' // Cancelled by buyer/seller/admin
  | 'expired'; // 48h passed with no action

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export type RefundStatus = 'pending' | 'processed' | 'failed';

export type CancelledBy = 'buyer' | 'seller' | 'admin' | 'system';

export type SettlementMethod = 'bank_transfer' | 'cpo' | 'cash' | 'other';

export interface IAdditionalDocument {
  name: string;
  url: string;
  uploadedAt: Date;
}

export interface ISaleReservation {

  // References
  listing: PopulatedDoc<ISaleListingDocument>;
  car: PopulatedDoc<ICarDocument>;
  buyer: PopulatedDoc<IUserDocument>;
  seller: PopulatedDoc<IUserDocument>;

  // Financial
  salePrice: number; // Listing price at time of reservation
  reservationFee: number; // Amount paid to reserve (calculated: 1% min 5k, max 50k)
  platformServiceFee: number; // 2% of sale price
  finalSettlementAmount: number; // salePrice - reservationFee

  // Payment tracking
  paymentStatus: PaymentStatus;
  paymentTransaction?: mongoose.Types.ObjectId; // Transaction reference
  paymentMethod?: string; // 'chapa', 'telebirr', 'stripe'

  // Status & Timeline
  status: ReservationStatus;
  reservedAt: Date;
  expiresAt: Date; // reservedAt + 48 hours (default)
  confirmedAt?: Date; // When inspection happened & buyer confirmed
  completedAt?: Date; // When final settlement completed
  cancelledAt?: Date;

  // Cancellation details
  cancellationReason?: string;
  cancelledBy?: CancelledBy;
  refundAmount?: number;
  refundStatus?: RefundStatus;
  refundTransaction?: mongoose.Types.ObjectId;

  // Inspection & Meeting
  inspectionScheduled: boolean;
  inspectionDate?: Date;
  inspectionLocation?: string;
  inspectionNotes?: string;
  agentAssigned?: PopulatedDoc<IUserDocument>; // Agent handling this sale

  // Settlement tracking (offline)
  settlementMethod?: SettlementMethod;
  settlementReference?: string; // Bank reference number, etc.
  settlementCompletedAt?: Date;
  transportAuthorityTransferDate?: Date;

  // Documents
  purchaseAgreementUrl?: string; // PDF URL in cloud storage
  purchaseAgreementGeneratedAt?: Date;
  additionalDocuments?: IAdditionalDocument[];

  // Automated reminders (for cron jobs)
  reminderSent24h?: boolean; // Whether 24-hour expiry reminder was sent
  reminderSent6h?: boolean;  // Whether 6-hour expiry reminder was sent

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface ISaleReservationDocument extends ISaleReservation, Document {
  // Virtual properties
  timeRemaining: number; // milliseconds until expiration
  isExpired: boolean; // whether reservation has expired
}

