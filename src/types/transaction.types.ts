import mongoose, { Document } from 'mongoose';
import { IChapaCustomization } from './chapa.types.js';

export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  SECURITY_DEPOSIT = 'deposit',
  EXCESS_CHARGE = 'excess',
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
  rentalFee: number;
  securityDeposit: number;
  serviceFee: number;
  deliveryFee: number;
  discountAmount: number;
}

export interface ITransaction {
  booking: mongoose.Types.ObjectId;
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
