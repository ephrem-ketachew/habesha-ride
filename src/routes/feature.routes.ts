import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as featureController from '../controllers/feature.controller.js';
import {
  getFeaturesSchema,
  getFeatureSchema,
  createFeatureSchema,
  updateFeatureSchema,
} from '../validation/feature.validation.js';

const router = Router();

/**
 * @swagger
 * /features:
 *   get:
 *     summary: Get all features
 *     tags: [Features]
 *     description: Retrieve a paginated list of active features with optional search. This endpoint is public and does not require authentication.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search features by name (partial match, case-insensitive)
 *         example: ABS
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Successfully retrieved features
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
 *                   example: 15
 *                 data:
 *                   type: object
 *                   properties:
 *                     features:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Feature'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 2
 *                         totalResults:
 *                           type: integer
 *                           example: 50
 */
router.get(
  '/',
  validate(getFeaturesSchema, 'query'),
  featureController.getFeaturesHandler,
);

/**
 * @swagger
 * /features/{id}:
 *   get:
 *     summary: Get a single feature by ID
 *     tags: [Features]
 *     description: Retrieve detailed information about a specific feature. This endpoint is public.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Feature ID (MongoDB ObjectId)
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Successfully retrieved feature
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     feature:
 *                       $ref: '#/components/schemas/Feature'
 *       404:
 *         description: Feature not found
 */
router.get(
  '/:id',
  validate(getFeatureSchema, 'params'),
  featureController.getFeatureHandler,
);

/**
 * @swagger
 * /features:
 *   post:
 *     summary: Create a new feature (Admin only)
 *     tags: [Features]
 *     description: Create a new feature in the system. Requires admin or superadmin role.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Feature name (must be unique)
 *                 example: Bluetooth
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether this feature is active
 *     responses:
 *       201:
 *         description: Feature created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     feature:
 *                       $ref: '#/components/schemas/Feature'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 *       409:
 *         description: Conflict - feature already exists
 */
router.post(
  '/',
  protect,
  restrictTo('admin', 'superadmin'),
  validate(createFeatureSchema, 'body'),
  featureController.createFeatureHandler,
);

/**
 * @swagger
 * /features/{id}:
 *   patch:
 *     summary: Update a feature (Admin only)
 *     tags: [Features]
 *     description: Update an existing feature's name or active status. Requires admin or superadmin role.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Feature ID (MongoDB ObjectId)
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Feature name
 *                 example: Advanced Bluetooth
 *               isActive:
 *                 type: boolean
 *                 description: Whether this feature is active
 *                 example: false
 *     responses:
 *       200:
 *         description: Feature updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     feature:
 *                       $ref: '#/components/schemas/Feature'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 *       404:
 *         description: Feature not found
 *       409:
 *         description: Conflict - feature name already exists
 */
router.patch(
  '/:id',
  protect,
  restrictTo('admin', 'superadmin'),
  validate(getFeatureSchema, 'params'),
  validate(updateFeatureSchema, 'body'),
  featureController.updateFeatureHandler,
);

/**
 * @swagger
 * /features/{id}:
 *   delete:
 *     summary: Delete a feature (Admin only)
 *     tags: [Features]
 *     description: Delete a feature from the system. Cannot delete if cars are using this feature. Requires admin or superadmin role.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Feature ID (MongoDB ObjectId)
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       204:
 *         description: Feature deleted successfully
 *       400:
 *         description: Bad request - feature has associated cars
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 *       404:
 *         description: Feature not found
 */
router.delete(
  '/:id',
  protect,
  restrictTo('admin', 'superadmin'),
  validate(getFeatureSchema, 'params'),
  featureController.deleteFeatureHandler,
);

export default router;

