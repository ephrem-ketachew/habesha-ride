import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.util.js';
import * as carService from '../services/car.service.js';
import * as userService from '../services/user.service.js';
import { GetCarParams } from '../validation/car.validation.js';
import { UpdateUserRoleInput } from '../validation/admin.validation.js';
import {
  UpdateCarStatusInput,
  GetCarsAdminQuery,
  GetUsersAdminQuery,
  UpdateUserStatusInput,
} from '../validation/admin.validation.js';

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
