import { Router } from 'express';
import * as listingController from '../controllers/listing.controller.js';

const router = Router();

router.get('/feed', listingController.getUnifiedListingsHandler);

export default router;
