import { Router } from 'express';
import * as modelController from '../controllers/model.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { getModelsByMakeSchema } from '../validation/model.validation.js';

const router = Router();

router.get(
  '/',
  validate(getModelsByMakeSchema, 'query'),
  modelController.getModelsByMake,
);

export default router;
