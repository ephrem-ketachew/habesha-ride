import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { upload } from '../utils/fileUpload.util.js';
import * as carController from '../controllers/car.controller.js';

const router = Router();

router.use(protect);

router.post('/', upload.array('photos', 10), carController.createCarHandler);

export default router;
