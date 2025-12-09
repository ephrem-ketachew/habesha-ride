import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.util.js';
import * as paymentService from '../services/payment.service.js';
import { verifyWebhookSignature } from '../utils/chapa.util.js';
import logger from '../config/logger.config.js';
import {
  InitializePaymentInput,
  VerifyPaymentInput,
  GetTransactionsByBookingInput,
  GetTransactionInput,
  RefundPaymentBodyInput,
  AdminTransactionFiltersInput,
} from '../validation/payment.validation.js';
import { IChapaWebhookPayload } from '../types/chapa.types.js';

export const initializePaymentHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { bookingId } = req.body as InitializePaymentInput;
    const userId = req.user!.id;

    const result = await paymentService.initializePayment(bookingId, userId);

    res.status(200).json({
      status: 'success',
      data: {
        transaction: result.transaction,
        checkout_url: result.checkout_url,
      },
      message:
        'Payment initialized successfully. Redirect user to checkout_url.',
    });
  },
);

export const verifyPaymentHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { tx_ref } = req.params as VerifyPaymentInput;
    const userId = req.user!.id;

    const result = await paymentService.verifyPayment(tx_ref, userId);

    const statusCode = result.transaction.status === 'completed' ? 200 : 402;

    res.status(statusCode).json({
      status: result.transaction.status === 'completed' ? 'success' : 'fail',
      data: {
        transaction: result.transaction,
        booking: result.booking,
      },
      message: result.message,
    });
  },
);

export const chapaWebhookHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const rawBody = req.body as Buffer;

    if (!Buffer.isBuffer(rawBody)) {
      logger.error(
        {
          bodyType: typeof req.body,
          bodyIsBuffer: Buffer.isBuffer(req.body),
          contentType: req.headers['content-type'],
        },
        'Webhook body is not a Buffer - middleware configuration issue',
      );
      return res.status(200).json({
        status: 'error',
        message: 'Invalid request body format',
      });
    }

    // Parse the body to JSON (as Chapa documentation shows)
    const payload: IChapaWebhookPayload = JSON.parse(rawBody.toString('utf8'));

    // According to Chapa docs:
    // - x-chapa-signature: HMAC SHA256 of the event payload signed using secret key
    // - chapa-signature: HMAC SHA256 of secret key signed using secret key (but example shows body)
    // We should check BOTH headers - if either is valid, proceed
    const xChapaSignature = req.headers['x-chapa-signature'] as string;
    const chapaSignature =
      (req.headers['chapa-signature'] as string) ||
      (req.headers['Chapa-Signature'] as string);

    if (!xChapaSignature && !chapaSignature) {
      logger.error(
        {
          headers: Object.keys(req.headers),
          availableSignatureHeaders: {
            'x-chapa-signature': req.headers['x-chapa-signature'],
            'chapa-signature': req.headers['chapa-signature'],
            'Chapa-Signature': req.headers['Chapa-Signature'],
          },
        },
        'Webhook signature headers not found',
      );
      return res.status(200).json({
        status: 'error',
        message: 'Missing webhook signature',
      });
    }

    // Verify signature(s) - Chapa docs say to check both, if either is valid, proceed
    // According to example: hash = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex')
    const bodyString = JSON.stringify(payload); // Stringify the parsed JSON (as per Chapa example)
    let isValid = false;

    if (xChapaSignature) {
      isValid = verifyWebhookSignature(
        bodyString,
        xChapaSignature,
        'x-chapa-signature',
      );
    }

    if (!isValid && chapaSignature) {
      isValid = verifyWebhookSignature(
        bodyString,
        chapaSignature,
        'chapa-signature',
      );
    }

    if (!isValid) {
      logger.error(
        {
          xChapaSignaturePresent: !!xChapaSignature,
          chapaSignaturePresent: !!chapaSignature,
          bodyPreview: bodyString.substring(0, 200),
        },
        'Both signature headers failed verification',
      );
      return res.status(200).json({
        status: 'error',
        message: 'Invalid webhook signature',
      });
    }
    logger.info(
      {
        tx_ref: payload.tx_ref,
        event: payload.event,
        status: payload.status,
      },
      'Webhook received and signature verified',
    );
    await paymentService.processWebhook(payload);
    res.status(200).json({
      status: 'success',
      message: 'Webhook processed successfully',
    });
  } catch (error: any) {
    logger.error(
      {
        error: error.message,
        errorStack: error.stack,
        body: req.body instanceof Buffer ? 'Buffer' : req.body,
        signaturePresent: !!(
          req.headers['chapa-signature'] ||
          req.headers['x-chapa-signature'] ||
          req.headers['X-Chapa-Signature']
        ),
        signatureHeader:
          req.headers['chapa-signature'] ||
          req.headers['x-chapa-signature'] ||
          req.headers['X-Chapa-Signature'],
      },
      'Webhook processing error',
    );
    res.status(200).json({
      status: 'error',
      message: 'Webhook processing failed',
    });
  }
};

export const getTransactionsByBookingHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { bookingId } = req.params as GetTransactionsByBookingInput;
    const userId = req.user!.id;

    const transactions = await paymentService.getTransactionsByBooking(
      bookingId,
      userId,
    );

    res.status(200).json({
      status: 'success',
      results: transactions.length,
      data: {
        transactions,
      },
    });
  },
);

export const getTransactionHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { transactionId } = req.params as GetTransactionInput;
    const userId = req.user!.id;

    const transaction = await paymentService.getTransactionById(
      transactionId,
      userId,
    );

    res.status(200).json({
      status: 'success',
      data: {
        transaction,
      },
    });
  },
);

export const processRefundHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { transactionId } = req.params;
    const { reason } = req.body as RefundPaymentBodyInput;

    const transaction =
      await paymentService.getTransactionForAdmin(transactionId);

    const refundTransaction = await paymentService.createRefundTransaction(
      transaction.booking.toString(),
      transaction.amount,
      reason,
    );

    res.status(200).json({
      status: 'success',
      data: {
        refundTransaction,
      },
      message:
        'Refund initiated successfully. Admin must process manually via Chapa dashboard.',
    });
  },
);

export const getAllTransactionsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const filters = req.query as unknown as AdminTransactionFiltersInput;

    const result = await paymentService.getAllTransactions(filters);

    res.status(200).json({
      status: 'success',
      results: result.transactions.length,
      total: result.total,
      data: {
        transactions: result.transactions,
      },
    });
  },
);

export const completeRefundHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { transactionId } = req.params;

    const transaction = await paymentService.completeRefund(transactionId);

    res.status(200).json({
      status: 'success',
      data: {
        transaction,
      },
      message: 'Refund marked as completed. User has been notified via email.',
    });
  },
);
