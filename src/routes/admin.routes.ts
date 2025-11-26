import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as adminController from '../controllers/admin.controller.js';
import {
  getCarsAdminSchema,
  updateCarStatusSchema,
  getUsersAdminSchema,
  updateUserStatusSchema,
  getListingsAdminSchema,
  updateSaleListingStatusAdminSchema,
  updateRentalListingStatusAdminSchema,
  createModelSchema,
  createMakeSchema,
  updateMakeSchema,
  updateModelSchema,
} from '../validation/admin.validation.js';
import { getCarSchema } from '../validation/car.validation.js';
import { updateUserRoleSchema } from '../validation/admin.validation.js';
import { getUserSchema } from '../validation/user.schema.js';

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

router.get(
  '/listings/rent',
  validate(getListingsAdminSchema, 'query'),
  adminController.getAllRentalListingsHandler,
);

router.patch(
  '/listings/rent/:id/status',
  validate(getCarSchema, 'params'),
  validate(updateRentalListingStatusAdminSchema, 'body'),
  adminController.updateRentalListingStatusHandler,
);

router.get(
  '/listings/sale',
  validate(getListingsAdminSchema, 'query'),
  adminController.getAllSaleListingsHandler,
);

router.patch(
  '/listings/sale/:id/status',
  validate(getCarSchema, 'params'),
  validate(updateSaleListingStatusAdminSchema, 'body'),
  adminController.updateSaleListingStatusHandler,
);

router.get(
  '/cars/:id',
  validate(getCarSchema, 'params'),
  adminController.getCarDetailsHandler,
);

router.get(
  '/users/:id',
  validate(getUserSchema, 'params'),
  adminController.getUserDetailsHandler,
);

router.get(
  '/listings/rent/:id',
  validate(getCarSchema, 'params'),
  adminController.getRentalListingDetailsHandler,
);

router.get(
  '/listings/sale/:id',
  validate(getCarSchema, 'params'),
  adminController.getSaleListingDetailsHandler,
);

router.post(
  '/makes',
  validate(createMakeSchema, 'body'),
  adminController.createMakeHandler,
);

router.post(
  '/models',
  validate(createModelSchema, 'body'),
  adminController.createModelHandler,
);

router.patch(
  '/makes/:id',
  validate(getCarSchema, 'params'),
  validate(updateMakeSchema, 'body'),
  adminController.updateMakeHandler,
);

router.patch(
  '/models/:id',
  validate(getCarSchema, 'params'),
  validate(updateModelSchema, 'body'),
  adminController.updateModelHandler,
);

router.delete(
  '/makes/:id',
  validate(getCarSchema, 'params'),
  adminController.deleteMakeHandler,
);

router.delete(
  '/models/:id',
  validate(getCarSchema, 'params'),
  adminController.deleteModelHandler,
);

export default router;
