import mongoose, { Document } from 'mongoose';
import { IChapaCustomization } from './chapa.types.js';

export enum TransactionType {
  PAYMENT = 'payment', // Rental payment
  REFUND = 'refund', // Rental refund
  SECURITY_DEPOSIT = 'deposit', // Rental security deposit
  EXCESS_CHARGE = 'excess', // Rental excess charges
  SALE_RESERVATION = 'sale_reservation', // Sale reservation fee payment
  SALE_REFUND = 'sale_refund', // Sale reservation fee refund
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUND_PENDING = 'refund_pending',
  REFUNDED = 'refunded',
  REFUND_FAILED = 'refund_failed',
}

export enum PaymentProvider {
  CHAPA = 'chapa',
  MANUAL = 'manual',
}

export interface IFinancialBreakdown {
  rentalFee?: number; // For rentals
  securityDeposit?: number; // For rentals
  serviceFee?: number; // For rentals
  deliveryFee?: number; // For rentals
  discountAmount?: number; // For rentals
  
  // Sale-specific breakdown
  reservationFee?: number; // For sale reservations
  salePrice?: number; // Original sale price (for reference)
  refundAmount?: number; // For sale refunds
  platformFee?: number; // Platform fee retained
}

export interface ITransaction {
  booking?: mongoose.Types.ObjectId; // Optional now - only for rentals
  saleReservation?: mongoose.Types.ObjectId; // For sale transactions
  user: mongoose.Types.ObjectId;
  type: TransactionType;
  status: TransactionStatus;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  breakdown?: IFinancialBreakdown;
  chapaTxRef: string;
  chapaCheckoutUrl?: string;
  chapaTransactionId?: string;
  chapaPaymentMethod?: string;
  chapaCustomization?: IChapaCustomization;
  chapaResponse?: any;
  webhookReceived: boolean;
  webhookPayload?: any;
  webhookReceivedAt?: Date;
  callbackUrl?: string;
  returnUrl?: string;
  idempotencyKey: string;
  attempts: number;
  lastError?: string;
  initiatedAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransactionDocument extends ITransaction, Document {}
