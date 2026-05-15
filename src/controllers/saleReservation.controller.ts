import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.util.js';
import * as saleReservationService from '../services/saleReservation.service.js';
import * as paymentService from '../services/payment.service.js';
import * as purchaseAgreementService from '../services/purchaseAgreement.service.js';
import {
  CreateSaleReservationInput,
  CancelSaleReservationInput,
  ConfirmSaleReservationInput,
  ScheduleInspectionInput,
  GetSaleReservationsQuery,
} from '../validation/sale.validation.js';

export const createReservationHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const reservation = await saleReservationService.createReservation(
      req.user!.id,
      req.body as CreateSaleReservationInput,
    );

    res.status(201).json({
      status: 'success',
      data: {
        reservation,
        nextStep: 'initialize_payment',
        message:
          'Reservation created. Please proceed with payment to secure your reservation.',
      },
    });
  },
);

export const getReservationHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const reservation = await saleReservationService.getReservationById(
      id,
      req.user!.id,
      req.user!.role,
    );

    res.status(200).json({
      status: 'success',
      data: { reservation },
    });
  },
);

export const getMyReservationsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await saleReservationService.getMyReservations(
      req.user!.id,
      req.query as unknown as GetSaleReservationsQuery,
    );

    res.status(200).json({
      status: 'success',
      results: result.reservations.length,
      pagination: result.pagination,
      data: { reservations: result.reservations },
    });
  },
);

export const getSellerReservationsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await saleReservationService.getSellerReservations(
      req.user!.id,
      req.query as unknown as GetSaleReservationsQuery,
    );

    res.status(200).json({
      status: 'success',
      results: result.reservations.length,
      pagination: result.pagination,
      data: { reservations: result.reservations },
    });
  },
);

export const cancelReservationHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const result = await saleReservationService.cancelReservation(
      id,
      req.user!.id,
      req.body as CancelSaleReservationInput,
    );

    res.status(200).json({
      status: 'success',
      message: 'Reservation cancelled successfully',
      data: result,
    });
  },
);

export const sellerCancelReservationHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const result = await saleReservationService.sellerCancelReservation(
      id,
      req.user!.id,
      (req.body as CancelSaleReservationInput).reason,
    );

    res.status(200).json({
      status: 'success',
      message:
        'Reservation cancelled. Buyer will receive full refund plus penalty.',
      data: result,
    });
  },
);

export const confirmReservationHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const reservation = await saleReservationService.confirmReservation(
      id,
      req.user!.id,
      req.body as ConfirmSaleReservationInput,
    );

    res.status(200).json({
      status: 'success',
      message: 'Reservation confirmed. Proceed with final settlement.',
      data: { reservation },
    });
  },
);

export const scheduleInspectionHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const reservation = await saleReservationService.scheduleInspection(
      id,
      req.user!.id,
      req.body as ScheduleInspectionInput,
    );

    res.status(200).json({
      status: 'success',
      message: 'Inspection scheduled successfully',
      data: { reservation },
    });
  },
);

export const regenerateAgreementHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const reservation =
      await purchaseAgreementService.generateAndUpdatePurchaseAgreement(id);

    res.status(200).json({
      status: 'success',
      message: 'Purchase agreement regenerated successfully',
      data: {
        reservation: {
          _id: reservation._id,
          purchaseAgreementUrl: reservation.purchaseAgreementUrl,
          purchaseAgreementGeneratedAt:
            reservation.purchaseAgreementGeneratedAt,
        },
      },
    });
  },
);

export const initializePaymentHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { reservationId } = req.body;
    const result = await paymentService.initializeSaleReservationPayment(
      reservationId,
      req.user!.id,
    );

    res.status(200).json({
      status: 'success',
      message: 'Payment initialized successfully',
      data: {
        transaction: result.transaction,
        checkout_url: result.checkout_url,
      },
    });
  },
);

export const verifyPaymentHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { tx_ref } = req.params;
    const result = await paymentService.verifySaleReservationPayment(
      tx_ref,
      req.user!.id,
    );

    res.status(200).json({
      status: 'success',
      message: result.message || 'Payment verified',
      data: {
        transaction: result.transaction,
        reservation: result.reservation,
      },
    });
  },
);
