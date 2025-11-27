import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as cityController from '../controllers/city.controller.js';
import {
  getCitiesSchema,
  getCitySchema,
  createCitySchema,
  updateCitySchema,
} from '../validation/city.validation.js';

const router = Router();

/**
 * @swagger
 * /cities:
 *   get:
 *     summary: Get all cities with filtering and pagination
 *     tags: [Cities]
 *     description: Retrieve a paginated list of active cities with optional filtering by region and search, and sorting. This endpoint is public and does not require authentication.
 *     parameters:
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *         description: Filter by region (partial match, case-insensitive)
 *         example: Oromia
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search cities by name (partial match, case-insensitive)
 *         example: Adama
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, region]
 *           default: name
 *         description: Sort by field
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
 *         description: Successfully retrieved cities
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
 *                     cities:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/City'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *                         totalResults:
 *                           type: integer
 *                           example: 250
 */
router.get(
  '/',
  validate(getCitiesSchema, 'query'),
  cityController.getCitiesHandler,
);

/**
 * @swagger
 * /cities/grouped:
 *   get:
 *     summary: Get cities grouped by region
 *     tags: [Cities]
 *     description: Retrieve all active cities grouped by region, optimized for dropdown/select components. This endpoint is public and does not require authentication.
 *     responses:
 *       200:
 *         description: Successfully retrieved grouped cities
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
 *                     cities:
 *                       type: object
 *                       description: Cities grouped by region
 *                       additionalProperties:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                               example: 507f1f77bcf86cd799439011
 *                             name:
 *                               type: string
 *                               example: Adama
 *                       example:
 *                         Oromia:
 *                           - _id: 507f1f77bcf86cd799439011
 *                             name: Adama
 *                           - _id: 507f1f77bcf86cd799439012
 *                             name: Asella
 *                         Amhara:
 *                           - _id: 507f1f77bcf86cd799439013
 *                             name: Bahir Dar
 */
router.get('/grouped', cityController.getCitiesGroupedByRegionHandler);

/**
 * @swagger
 * /cities/{id}:
 *   get:
 *     summary: Get a single city by ID
 *     tags: [Cities]
 *     description: Retrieve detailed information about a specific city. This endpoint is public.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: City ID (MongoDB ObjectId)
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Successfully retrieved city
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
 *                     city:
 *                       $ref: '#/components/schemas/City'
 *       404:
 *         description: City not found
 */
router.get(
  '/:id',
  validate(getCitySchema, 'params'),
  cityController.getCityHandler,
);

/**
 * @swagger
 * /cities:
 *   post:
 *     summary: Create a new city (Admin only)
 *     tags: [Cities]
 *     description: Create a new city in the system. Requires admin or superadmin role.
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
 *               - region
 *             properties:
 *               name:
 *                 type: string
 *                 description: City name (must be unique)
 *                 example: Addis Ababa
 *               region:
 *                 type: string
 *                 description: Region or state
 *                 example: Addis Ababa
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether this city is active
 *     responses:
 *       201:
 *         description: City created successfully
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
 *                     city:
 *                       $ref: '#/components/schemas/City'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 *       409:
 *         description: Conflict - city already exists
 */
router.post(
  '/',
  protect,
  restrictTo('admin', 'superadmin'),
  validate(createCitySchema, 'body'),
  cityController.createCityHandler,
);

/**
 * @swagger
 * /cities/{id}:
 *   patch:
 *     summary: Update a city (Admin only)
 *     tags: [Cities]
 *     description: Update an existing city's name, region, or active status. Requires admin or superadmin role.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: City ID (MongoDB ObjectId)
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
 *                 description: City name
 *                 example: Addis Abeba
 *               region:
 *                 type: string
 *                 description: Region or state
 *                 example: Addis Ababa
 *               isActive:
 *                 type: boolean
 *                 description: Whether this city is active
 *                 example: false
 *     responses:
 *       200:
 *         description: City updated successfully
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
 *                     city:
 *                       $ref: '#/components/schemas/City'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 *       404:
 *         description: City not found
 *       409:
 *         description: Conflict - city name already exists
 */
router.patch(
  '/:id',
  protect,
  restrictTo('admin', 'superadmin'),
  validate(getCitySchema, 'params'),
  validate(updateCitySchema, 'body'),
  cityController.updateCityHandler,
);

/**
 * @swagger
 * /cities/{id}:
 *   delete:
 *     summary: Delete a city (Admin only)
 *     tags: [Cities]
 *     description: Delete a city from the system. Cannot delete if cars are associated with this city. Requires admin or superadmin role.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: City ID (MongoDB ObjectId)
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       204:
 *         description: City deleted successfully
 *       400:
 *         description: Bad request - city has associated cars
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 *       404:
 *         description: City not found
 */
router.delete(
  '/:id',
  protect,
  restrictTo('admin', 'superadmin'),
  validate(getCitySchema, 'params'),
  cityController.deleteCityHandler,
);

export default router;
