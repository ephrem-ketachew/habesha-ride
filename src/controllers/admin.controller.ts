import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.util.js';
import * as carService from '../services/car.service.js';
import * as userService from '../services/user.service.js';
import { GetCarParams } from '../validation/car.validation.js';
import {
  UpdateCarStatusInput,
  GetCarsAdminQuery,
  GetUsersAdminQuery,
  UpdateUserStatusInput,
  GetListingsAdminQuery,
  UpdateUserRoleInput,
  GetBookingsAdminQuery,
  CreateMakeInput,
  UpdateMakeInput,
  CreateModelInput,
  UpdateModelInput,
} from '../validation/admin.validation.js';
import {
  getAllSaleListingsAdmin,
  updateSaleListingStatus,
  getSaleListingByIdAdmin,
} from '../services/sale.service.js';
import {
  getAllRentalListingsAdmin,
  getRentalListingByIdAdmin,
  updateRentalListingStatus,
} from '../services/rental.service.js';
import {
  createMake,
  updateMake,
  createModel,
  updateModel,
  deleteMake,
  deleteModel,
} from '../services/admin.service.js';
import {
  getAllBookingsAdmin,
  getBookingByIdAdmin,
} from '../services/booking.service.js';
import * as saleReservationService from '../services/saleReservation.service.js';
import * as paymentService from '../services/payment.service.js';
import {
  GetSaleReservationsQuery,
  ExtendReservationInput,
  CompleteSaleInput,
  CancelSaleReservationInput,
  ProcessManualRefundInput,
  AssignAgentInput,
  GetSaleAnalyticsInput,
} from '../validation/sale.validation.js';

export const getAllCarsAdminHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query as unknown as GetCarsAdminQuery;

    const data = await carService.getAllCarsAdmin(query);

    res.status(200).json({
      status: 'success',
      ...data,
    });
  },
);

export const updateCarStatusHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id: carId } = req.params as GetCarParams;
    const { status } = req.body as UpdateCarStatusInput;

    const car = await carService.updateCarVerificationStatus(carId, status);

    res.status(200).json({
      status: 'success',
      message: `Car status updated to ${status}.`,
      data: {
        car,
      },
    });
  },
);

export const updateUserRoleHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;
    const { role } = req.body as UpdateUserRoleInput;
    const currentUserId = req.user!.id;

    const user = await userService.updateUserRole(userId, role, currentUserId);

    res.status(200).json({
      status: 'success',
      message: `User role updated to ${role}.`,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
        },
      },
    });
  },
);

export const getAllUsersAdminHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query as unknown as GetUsersAdminQuery;
    const data = await userService.getAllUsersAdmin(query);

    res.status(200).json({
      status: 'success',
      ...data,
    });
  },
);

export const updateUserStatusHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;
    const { status } = req.body as UpdateUserStatusInput;

    const user = await userService.updateUserStatus(userId, status);

    res.status(200).json({
      status: 'success',
      message: `User status updated to ${status}.`,
      data: {
        user: {
          id: user.id,
          email: user.email,
          status: user.status,
          fullName: user.fullName,
        },
      },
    });
  },
);

export const getAllRentalListingsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query as unknown as GetListingsAdminQuery;
    const data = await getAllRentalListingsAdmin(query);
    res.status(200).json({ status: 'success', ...data });
  },
);

export const updateRentalListingStatusHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { status } = req.body;
    const listing = await updateRentalListingStatus(id, status);
    res.status(200).json({ status: 'success', data: { listing } });
  },
);

export const getAllSaleListingsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query as unknown as GetListingsAdminQuery;
    const data = await getAllSaleListingsAdmin(query);
    res.status(200).json({ status: 'success', ...data });
  },
);

export const updateSaleListingStatusHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { status } = req.body;
    const listing = await updateSaleListingStatus(id, status);
    res.status(200).json({ status: 'success', data: { listing } });
  },
);

export const getCarDetailsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const car = await carService.getCarByIdAdmin(id);

    res.status(200).json({
      status: 'success',
      data: { car },
    });
  },
);

export const getUserDetailsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const includeCars = req.query.includeCars !== 'false';
    const carsPage = Number(req.query.carsPage) || 1;
    const carsLimit = Number(req.query.carsLimit) || 10;

    const data = await userService.getUserByIdAdmin(id, {
      includeCars,
      carsPage,
      carsLimit,
    });

    res.status(200).json({
      status: 'success',
      data,
    });
  },
);

export const getRentalListingDetailsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const listing = await getRentalListingByIdAdmin(id);
    res.status(200).json({ status: 'success', data: { listing } });
  },
);

export const getSaleListingDetailsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const listing = await getSaleListingByIdAdmin(id);
    res.status(200).json({ status: 'success', data: { listing } });
  },
);

export const createMakeHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const make = await createMake(req.body as CreateMakeInput);
    res.status(201).json({ status: 'success', data: { make } });
  },
);

export const updateMakeHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const make = await updateMake(id, req.body as UpdateMakeInput);
    res.status(200).json({ status: 'success', data: { make } });
  },
);

export const createModelHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const model = await createModel(req.body as CreateModelInput);
    res.status(201).json({ status: 'success', data: { model } });
  },
);

export const updateModelHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const model = await updateModel(id, req.body as UpdateModelInput);
    res.status(200).json({ status: 'success', data: { model } });
  },
);

export const deleteMakeHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    await deleteMake(id);
    res.status(204).json({ status: 'success', data: null });
  },
);

export const deleteModelHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    await deleteModel(id);
    res.status(204).json({ status: 'success', data: null });
  },
);

export const getAllBookingsAdminHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query as unknown as GetBookingsAdminQuery;
    const data = await getAllBookingsAdmin(query);
    res.status(200).json({ status: 'success', ...data });
  },
);

export const getBookingDetailsAdminHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const booking = await getBookingByIdAdmin(id);
    res.status(200).json({ status: 'success', data: { booking } });
  },
);

// ==================== SALE RESERVATION ADMIN HANDLERS ====================

export const getAllSaleReservationsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query as unknown as GetSaleReservationsQuery;
    const result = await saleReservationService.getAllSaleReservationsAdmin(query);

    res.status(200).json({
      status: 'success',
      results: result.reservations.length,
      pagination: result.pagination,
      data: { reservations: result.reservations },
    });
  },
);

export const getSaleReservationDetailsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const reservation = await saleReservationService.getReservationById(id, req.user!.id, req.user!.role);

    res.status(200).json({
      status: 'success',
      data: { reservation },
    });
  },
);

export const extendReservationHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const input = req.body as ExtendReservationInput;

    const reservation = await saleReservationService.extendReservationExpiry(
      id,
      input.extensionHours,
      input.reason,
      req.user!.id,
    );

    res.status(200).json({
      status: 'success',
      message: `Reservation expiry extended by ${input.extensionHours} hours`,
      data: { reservation },
    });
  },
);

export const completeSaleReservationHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const input = req.body as CompleteSaleInput;

    const result = await saleReservationService.completeSaleReservationAdmin(
      id,
      input,
      req.user!.id,
    );

    res.status(200).json({
      status: 'success',
      message: 'Reservation completed successfully',
      data: result,
    });
  },
);

export const cancelSaleReservationAdminHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { reason, processRefund = true } = req.body as CancelSaleReservationInput & { processRefund?: boolean };

    const result = await saleReservationService.cancelReservationAdmin(
      id,
      reason,
      processRefund,
      req.user!.id,
    );

    res.status(200).json({
      status: 'success',
      message: 'Reservation cancelled by admin',
      data: result,
    });
  },
);

export const processManualRefundHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { refundAmount, reason } = req.body as ProcessManualRefundInput;

    const refundTx = await paymentService.processSaleRefund(id, refundAmount, reason);

    res.status(200).json({
      status: 'success',
      message: 'Refund processed successfully',
      data: { refundTransaction: refundTx },
    });
  },
);

export const assignAgentHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { agentId, notes } = req.body as AssignAgentInput;

    const reservation = await saleReservationService.assignAgentToReservation(
      id,
      agentId,
      notes || '',
      req.user!.id,
    );

    res.status(200).json({
      status: 'success',
      message: 'Agent assigned successfully',
      data: { reservation },
    });
  },
);

export const getSaleAnalyticsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query as GetSaleAnalyticsInput;

    const analytics = await saleReservationService.getSaleReservationsAnalytics(query);

    res.status(200).json({
      status: 'success',
      data: analytics,
    });
  },
);
