import { Router } from 'express';
import { registerHandler } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerUserSchema } from '../validation/auth.schema.js';

const router = Router();

router.post('/register', validate(registerUserSchema), registerHandler);

export default router;
