import { Router } from 'express';
import * as makeController from '../controllers/make.controller.js';

const router = Router();

router.get('/', makeController.getAllMakes);

export default router;
