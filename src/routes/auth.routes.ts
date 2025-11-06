import { Router } from 'express';
import {
  registerHandler,
  verifyEmailHandler,
  loginHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  updatePasswordHandler,
  googleAuthHandler,
} from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  registerUserSchema,
  verifyEmailSchema,
  loginUserSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resetPasswordTokenSchema,
  updatePasswordSchema,
  googleAuthSchema,
} from '../validation/auth.schema.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', validate(registerUserSchema), registerHandler);

router.get(
  '/verify-email',
  validate(verifyEmailSchema, 'query'),
  verifyEmailHandler,
);

router.post('/login', validate(loginUserSchema, 'body'), loginHandler);

router.post(
  '/forgot-password',
  validate(forgotPasswordSchema, 'body'),
  forgotPasswordHandler,
);

router.patch(
  '/reset-password/:token',
  validate(resetPasswordTokenSchema, 'params'),
  validate(resetPasswordSchema, 'body'),
  resetPasswordHandler,
);

router.patch(
  '/update-password',
  protect,
  validate(updatePasswordSchema, 'body'),
  updatePasswordHandler,
);

router.post('/google', validate(googleAuthSchema, 'body'), googleAuthHandler);

export default router;
