import crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';
import config from '../config/env.config.js';
import AppError from './appError.util.js';
import logger from '../config/logger.config.js';
import {
  IChapaInitializePaymentInput,
  IChapaInitializePaymentResponse,
  IChapaVerifyPaymentResponse,
} from '../types/chapa.types.js';

const chapaClient: AxiosInstance = axios.create({
  baseURL: config.chapa.baseUrl,
  headers: {
    Authorization: `Bearer ${config.chapa.secretKey}`,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const initializePayment = async (
  input: IChapaInitializePaymentInput,
): Promise<IChapaInitializePaymentResponse> => {
  try {
    logger.info(
      {
        tx_ref: input.tx_ref,
        amount: input.amount,
        email: input.email,
      },
      'Initializing Chapa payment',
    );

    const response = await chapaClient.post('/transaction/initialize', input);

    if (response.data.status !== 'success') {
      logger.error(
        { response: response.data, input },
        'Chapa payment initialization failed - status not success',
      );
      throw new AppError(
        response.data.message || 'Chapa payment initialization failed',
        500,
      );
    }

    const checkoutUrl = response.data.data?.checkout_url;
    if (!checkoutUrl) {
      logger.error(
        { response: response.data, input },
        'Chapa payment initialization failed - no checkout_url',
      );
      throw new AppError('No checkout URL received from Chapa', 500);
    }

    logger.info(
      {
        tx_ref: input.tx_ref,
        checkout_url: checkoutUrl,
      },
      'Chapa payment initialized successfully',
    );

    return {
      checkout_url: checkoutUrl,
      tx_ref: input.tx_ref,
    };
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message =
        error.response?.data?.message ||
        error.message ||
        'Payment initialization failed';

      logger.error(
        {
          error: error.message,
          response: error.response?.data,
          status,
          input,
        },
        'Chapa API error: initializePayment',
      );

      throw new AppError(message, status);
    }

    logger.error(
      { error: error.message, input },
      'Unexpected error during payment initialization',
    );
    throw new AppError('Payment initialization failed', 500);
  }
};

export const verifyPayment = async (
  tx_ref: string,
): Promise<IChapaVerifyPaymentResponse> => {
  try {
    logger.info({ tx_ref }, 'Verifying payment with Chapa');

    const response = await chapaClient.get(`/transaction/verify/${tx_ref}`);

    if (response.data.status !== 'success') {
      logger.error(
        { response: response.data, tx_ref },
        'Chapa payment verification failed - status not success',
      );
      throw new AppError(
        response.data.message || 'Payment verification failed',
        400,
      );
    }

    const paymentData = response.data.data;
    if (!paymentData) {
      logger.error(
        { response: response.data, tx_ref },
        'Chapa payment verification failed - no data',
      );
      throw new AppError('No payment data received from Chapa', 500);
    }

    logger.info(
      {
        tx_ref,
        status: paymentData.status,
        amount: paymentData.amount,
        method: paymentData.method,
      },
      'Chapa payment verified successfully',
    );

    return paymentData;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message =
        error.response?.data?.message ||
        error.message ||
        'Payment verification failed';

      logger.error(
        {
          error: error.message,
          response: error.response?.data,
          status,
          tx_ref,
        },
        'Chapa API error: verifyPayment',
      );

      if (status === 404) {
        throw new AppError(
          'Transaction not found in Chapa. It may not have been initialized or the reference is incorrect.',
          404,
        );
      }

      throw new AppError(message, status);
    }

    logger.error(
      { error: error.message, tx_ref },
      'Unexpected error during payment verification',
    );
    throw new AppError('Payment verification failed', 500);
  }
};

export const mapChapaStatusToTransactionStatus = (
  chapaStatus: string,
): string => {
  const statusMap: Record<string, string> = {
    success: 'completed',
    failed: 'failed',
    pending: 'processing',
    cancelled: 'cancelled',
  };

  return statusMap[chapaStatus.toLowerCase()] || 'failed';
};

export const verifyWebhookSignature = (
  payload: string | Buffer,
  signature: string,
): boolean => {
  if (!signature) {
    throw new AppError('Missing webhook signature', 400);
  }

  const receivedSignature = signature.replace(/^sha256=/, '');

  const computedSignature = crypto
    .createHmac('sha256', config.chapa.webhookSecret)
    .update(payload)
    .digest('hex');

  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(receivedSignature, 'hex'),
      Buffer.from(computedSignature, 'hex'),
    );

    if (!isValid) {
      throw new AppError('Invalid webhook signature', 403);
    }

    return true;
  } catch (error) {
    throw new AppError('Invalid webhook signature', 403);
  }
};

export const generateTxRef = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `kech-tx-${timestamp}-${random}`;
};

export const generateWebhookIdempotencyKey = (
  txRef: string,
  event: string,
  timestamp?: number,
): string => {
  const ts = timestamp || Date.now();
  return `webhook-${txRef}-${event}-${ts}`;
};

export const generatePaymentIdempotencyKey = (bookingId: string): string => {
  const timestamp = Date.now();
  return `payment-${bookingId}-${timestamp}`;
};

export const generateRefundIdempotencyKey = (bookingId: string): string => {
  const timestamp = Date.now();
  return `refund-${bookingId}-${timestamp}`;
};
