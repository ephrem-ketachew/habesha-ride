import { Router } from 'express';
import * as modelController from '../controllers/model.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { getModelsByMakeSchema } from '../validation/model.validation.js';

const router = Router();

/**
 * @swagger
 * /models:
 *   get:
 *     summary: Get car models by make
 *     tags: [Models]
 *     description: Retrieve a list of car models filtered by make (brand), sorted alphabetically by name. This endpoint is public and does not require authentication.
 *     parameters:
 *       - in: query
 *         name: make
 *         required: true
 *         schema:
 *           type: string
 *         description: Make (brand) ID - must be a valid MongoDB ObjectId
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Successfully retrieved vehicle models with count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                   description: Number of models returned
 *                   example: 15
 *                 data:
 *                   type: object
 *                   properties:
 *                     models:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/VehicleModel'
 *       400:
 *         description: Bad request - invalid Make ID format or make parameter missing
 */
router.get(
  '/',
  validate(getModelsByMakeSchema, 'query'),
  modelController.getModelsByMake,
);

export default router;
