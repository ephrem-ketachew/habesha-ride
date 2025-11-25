import { Router } from 'express';
import { protect, optionalProtect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as saleController from '../controllers/sale.controller.js';
import {
  createSaleListingSchema,
  updateSaleListingSchema,
  getSaleListingsQuerySchema,
  getSaleListingIdSchema,
} from '../validation/sale.validation.js';

const router = Router();


router.get(
  '/',
  validate(getSaleListingsQuerySchema, 'query'),
  saleController.getPublicSaleListingsHandler,
);

router.get(
  '/:id',
  optionalProtect,
  validate(getSaleListingIdSchema, 'params'),
  saleController.getSaleListingDetailsHandler,
);


router.use(protect);

router.post(
  '/',
  validate(createSaleListingSchema, 'body'),
  saleController.createSaleListingHandler,
);

router.get('/manage/my-listings', saleController.getMySaleListingsHandler);

router.patch(
  '/:id',
  validate(getSaleListingIdSchema, 'params'),
  validate(updateSaleListingSchema, 'body'),
  saleController.updateSaleListingHandler,
);

router.delete(
  '/:id',
  validate(getSaleListingIdSchema, 'params'),
  saleController.deleteSaleListingHandler,
);

export default router;
