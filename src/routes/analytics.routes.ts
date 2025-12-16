import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  getUserAnalyticsHandler,
  getAdminAnalyticsHandler,
} from '../controllers/analytics.controller.js';
import {
  getUserAnalyticsSchema,
  getAdminAnalyticsSchema,
} from '../validation/analytics.validation.js';

const router = Router();

router.get(
  '/user/analytics',
  protect,
  validate(getUserAnalyticsSchema, 'query'),
  getUserAnalyticsHandler,
);

router.get(
  '/admin/analytics',
  protect,
  restrictTo('admin', 'superadmin'),
  validate(getAdminAnalyticsSchema, 'query'),
  getAdminAnalyticsHandler,
);

export default router;