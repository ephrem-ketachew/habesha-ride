import { Router } from 'express';
import { protect, optionalProtect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as saleController from '../controllers/sale.controller.js';
import {
  createSaleListingSchema,
  updateSaleListingSchema,
  getSaleListingsQuerySchema,
  getSaleListingIdSchema,
} from '../validation/sale.validation.js';

const router = Router();

/**
 * @swagger
 * /listings/sale:
 *   get:
 *     summary: Get all public sale listings
 *     tags: [Sales]
 *     description: Retrieve a paginated list of all available sale listings. This endpoint is public and does not require authentication.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page (max 100)
 *         example: 20
 *       - in: query
 *         name: make
 *         schema:
 *           type: string
 *         description: Filter by car make (brand) ID - MongoDB ObjectId
 *         example: 507f1f77bcf86cd799439011
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *         description: Filter by car model ID - MongoDB ObjectId
 *         example: 507f1f77bcf86cd799439012
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum sale price for filtering
 *         example: 200000
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum sale price for filtering
 *         example: 800000
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city location
 *         example: Addis Ababa
 *       - in: query
 *         name: transmission
 *         schema:
 *           type: string
 *           enum: [automatic, manual]
 *         description: Filter by transmission type. All filters work in combination (AND logic).
 *         example: automatic
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Text search against car make name, model name, or city name (case-insensitive). All filters work in combination (AND logic).
 *         example: "Toyota"
 *     responses:
 *       200:
 *         description: Successfully retrieved sale listings with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 listings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SaleListing'
 *                 total:
 *                   type: integer
 *                   description: Total number of listings matching the query
 *                   example: 100
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *                   example: 5
 *       400:
 *         description: Bad request - invalid query parameters
 */
router.get(
  '/',
  validate(getSaleListingsQuerySchema, 'query'),
  saleController.getPublicSaleListingsHandler,
);

/**
 * @swagger
 * /listings/sale/{id}:
 *   get:
 *     summary: Get sale listing by ID
 *     tags: [Sales]
 *     description: Retrieve detailed information about a specific sale listing. Authentication is optional - if provided, additional user-specific data may be included in the response.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sale listing ID - must be a valid MongoDB ObjectId
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Successfully retrieved sale listing details
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
 *                     listing:
 *                       $ref: '#/components/schemas/SaleListing'
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Sale listing not found
 */
router.get(
  '/:id',
  optionalProtect,
  validate(getSaleListingIdSchema, 'params'),
  saleController.getSaleListingDetailsHandler,
);

router.use(protect);

/**
 * @swagger
 * /listings/sale:
 *   post:
 *     summary: Create a new sale listing
 *     tags: [Sales]
 *     description: Create a new sale listing for an approved car (requires authentication). The car must be owned by the authenticated user and have an 'approved' status.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - car
 *               - salePrice
 *               - listingDescription
 *             properties:
 *               car:
 *                 type: string
 *                 description: Car ID - must be a valid MongoDB ObjectId of an approved car owned by the user
 *                 example: 507f1f77bcf86cd799439011
 *               salePrice:
 *                 type: number
 *                 minimum: 0
 *                 description: Sale price of the vehicle (REQUIRED, cannot be negative)
 *                 example: 450000
 *               listingDescription:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *                 description: Detailed description of the sale listing (REQUIRED, 1-2000 characters)
 *                 example: "Well-maintained vehicle with complete service history. Single owner, regularly serviced at authorized dealer."
 *     responses:
 *       201:
 *         description: Sale listing created successfully
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
 *                     listing:
 *                       $ref: '#/components/schemas/SaleListing'
 *       400:
 *         description: Bad request - validation error or car already listed for sale
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - car not approved or not owned by user
 *       404:
 *         description: Car not found
 */
router.post(
  '/',
  validate(createSaleListingSchema, 'body'),
  saleController.createSaleListingHandler,
);

/**
 * @swagger
 * /listings/sale/manage/my-listings:
 *   get:
 *     summary: Get my sale listings
 *     tags: [Sales]
 *     description: Retrieve all sale listings owned by the authenticated user, including listings with any status (available, pending, sold)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user's sale listings with count
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
 *                   description: Number of listings returned
 *                   example: 8
 *                 data:
 *                   type: object
 *                   properties:
 *                     listings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SaleListing'
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 */
router.get('/manage/my-listings', saleController.getMySaleListingsHandler);

/**
 * @swagger
 * /listings/sale/{id}:
 *   patch:
 *     summary: Update a sale listing
 *     tags: [Sales]
 *     description: Update an existing sale listing (requires authentication and ownership). ALL fields are optional - only send the fields you want to update.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sale listing ID - must be a valid MongoDB ObjectId
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [available, pending, sold]
 *                 description: Listing status (optional)
 *                 example: available
 *               salePrice:
 *                 type: number
 *                 minimum: 0
 *                 description: Sale price (optional)
 *                 example: 480000
 *               listingDescription:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Listing description (optional, max 2000 characters if provided)
 *                 example: "Updated description with recent improvements and maintenance records"
 *     responses:
 *       200:
 *         description: Sale listing updated successfully
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
 *                     listing:
 *                       $ref: '#/components/schemas/SaleListing'
 *       400:
 *         description: Bad request - validation error or invalid ID format
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - not the owner of this listing
 *       404:
 *         description: Listing not found
 */
router.patch(
  '/:id',
  validate(getSaleListingIdSchema, 'params'),
  validate(updateSaleListingSchema, 'body'),
  saleController.updateSaleListingHandler,
);

/**
 * @swagger
 * /listings/sale/{id}:
 *   delete:
 *     summary: Delete a sale listing
 *     tags: [Sales]
 *     description: Delete an existing sale listing (requires authentication and ownership). This permanently removes the listing from the database.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sale listing ID - must be a valid MongoDB ObjectId
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       204:
 *         description: Sale listing deleted successfully (no content returned, but response includes status:success and data:null)
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - not the owner of this listing
 *       404:
 *         description: Listing not found
 */
router.delete(
  '/:id',
  validate(getSaleListingIdSchema, 'params'),
  saleController.deleteSaleListingHandler,
);

export default router;
