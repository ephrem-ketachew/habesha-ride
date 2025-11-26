import { Router } from 'express';
import * as makeController from '../controllers/make.controller.js';

const router = Router();

/**
 * @swagger
 * /makes:
 *   get:
 *     summary: Get all car makes
 *     tags: [Makes]
 *     description: Retrieve a list of all car makes (brands) sorted alphabetically by name. This endpoint is public and does not require authentication.
 *     responses:
 *       200:
 *         description: Successfully retrieved all car makes with count
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
 *                   description: Number of makes returned
 *                   example: 25
 *                 data:
 *                   type: object
 *                   properties:
 *                     makes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Make'
 */
router.get('/', makeController.getAllMakes);

export default router;
