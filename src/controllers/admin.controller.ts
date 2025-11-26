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
