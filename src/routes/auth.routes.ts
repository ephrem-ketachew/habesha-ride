import { Router } from 'express';
import {
  registerHandler,
  verifyEmailHandler,
  loginHandler,
} from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  registerUserSchema,
  verifyEmailSchema,
  loginUserSchema,
} from '../validation/auth.schema.js';

const router = Router();

router.post('/register', validate(registerUserSchema), registerHandler);

router.get(
  '/verify-email',
  validate(verifyEmailSchema, 'query'),
  verifyEmailHandler,
);

router.post('/login', validate(loginUserSchema, 'body'), loginHandler);

export default router;
