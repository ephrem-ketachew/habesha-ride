import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as adminController from '../controllers/admin.controller.js';
import {
  getCarsAdminSchema,
  updateCarStatusSchema,
  getUsersAdminSchema,
  updateUserStatusSchema,
} from '../validation/admin.validation.js';
import { getCarSchema } from '../validation/car.validation.js';
import { updateUserRoleSchema } from '../validation/admin.validation.js';
import { getUserSchema } from '@/validation/user.schema.js';

const router = Router();

router.use(protect, restrictTo('admin', 'superadmin'));

router.get(
  '/cars',
  validate(getCarsAdminSchema, 'query'),
  adminController.getAllCarsAdminHandler,
);

router.patch(
  '/cars/:id/status',
  validate(getCarSchema, 'params'),
  validate(updateCarStatusSchema, 'body'),
  adminController.updateCarStatusHandler,
);

router.patch(
  '/users/:id/role',
  restrictTo('superadmin'),
  validate(getUserSchema, 'params'),
  validate(updateUserRoleSchema, 'body'),
  adminController.updateUserRoleHandler,
);

router.get(
  '/users',
  validate(getUsersAdminSchema, 'query'),
  adminController.getAllUsersAdminHandler,
);

router.patch(
  '/users/:id/status',
  validate(getUserSchema, 'params'),
  validate(updateUserStatusSchema, 'body'),
  adminController.updateUserStatusHandler,
);

export default router;
