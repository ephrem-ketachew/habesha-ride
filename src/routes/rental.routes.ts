import { Router } from 'express';
import { protect, optionalProtect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as rentalController from '../controllers/rental.controller.js';
import {
  createRentalListingSchema,
  updateRentalListingSchema,
  getRentalListingsQuerySchema,
  getRentalListingIdSchema,
} from '../validation/rental.validation.js';

const router = Router();

router.get(
  '/',
  validate(getRentalListingsQuerySchema, 'query'),
  rentalController.getPublicRentalListingsHandler,
);

router.get(
  '/:id',
  optionalProtect,
  validate(getRentalListingIdSchema, 'params'),
  rentalController.getRentalListingDetailsHandler,
);

router.use(protect);

router.post(
  '/',
  validate(createRentalListingSchema, 'body'),
  rentalController.createRentalListingHandler,
);

router.get('/manage/my-listings', rentalController.getMyRentalListingsHandler);

router.patch(
  '/:id',
  validate(getRentalListingIdSchema, 'params'),
  validate(updateRentalListingSchema, 'body'),
  rentalController.updateRentalListingHandler,
);

router.delete(
  '/:id',
  validate(getRentalListingIdSchema, 'params'),
  rentalController.deleteRentalListingHandler,
);

export default router;
