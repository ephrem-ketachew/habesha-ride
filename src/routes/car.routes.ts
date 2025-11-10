import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { upload } from '../utils/fileUpload.util.js';
import * as carController from '../controllers/car.controller.js';
import { getCarSchema } from '@/validation/car.validation.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

router.use(protect);

router.post('/', upload.array('photos', 10), carController.createCarHandler);

router.get('/my-cars', carController.getMyCarsHandler);

router.get(
  '/:id',
  validate(getCarSchema, 'params'),
  carController.getCarHandler,
);

router.patch(
  '/:id',
  validate(getCarSchema, 'params'),
  upload.array('photos', 10),
  carController.updateCarHandler,
);

router.delete(
  '/:id',
  validate(getCarSchema, 'params'),
  carController.deleteCarHandler,
);

export default router;
