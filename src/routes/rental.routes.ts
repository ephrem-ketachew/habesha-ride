import { Router } from 'express';
import { protect, optionalProtect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as rentalController from '../controllers/rental.controller.js';
import {
  createRentalListingSchema,
  updateRentalListingSchema,
  getRentalListingsQuerySchema,
  getRentalListingIdSchema,
} from '../validation/rental.validation.js';

const router = Router();

/**
 * @swagger
 * /listings/rent:
 *   get:
 *     summary: Get all public rental listings
 *     tags: [Rentals]
 *     description: Retrieve a paginated list of all available rental listings. This endpoint is public and does not require authentication.
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
 *         description: Minimum rate per day for filtering
 *         example: 1000
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum rate per day for filtering
 *         example: 5000
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city location
 *         example: Addis Ababa
 *       - in: query
 *         name: bodyType
 *         schema:
 *           type: string
 *           enum: [sedan, suv, truck, hatchback, coupe, van, other]
 *         description: Filter by car body type
 *         example: suv
 *       - in: query
 *         name: transmission
 *         schema:
 *           type: string
 *           enum: [automatic, manual]
 *         description: Filter by transmission type
 *         example: automatic
 *       - in: query
 *         name: fuelType
 *         schema:
 *           type: string
 *           enum: [gasoline, diesel, electric, hybrid]
 *         description: Filter by fuel type
 *         example: gasoline
 *       - in: query
 *         name: genericColor
 *         schema:
 *           type: string
 *           enum: [Black, White, Silver, Grey, Blue, Red, Brown, Green, Beige, Orange, Gold, Yellow, Purple, Bronze, Burgundy, Other]
 *         description: Filter by generic color category
 *         example: Blue
 *       - in: query
 *         name: condition
 *         schema:
 *           type: string
 *           enum: [new, excellent, good, fair, poor]
 *         description: Filter by car condition
 *         example: good
 *       - in: query
 *         name: minSeats
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Minimum seating capacity
 *         example: 5
 *       - in: query
 *         name: minYear
 *         schema:
 *           type: integer
 *           minimum: 1900
 *         description: Minimum manufacturing year
 *         example: 2020
 *       - in: query
 *         name: maxYear
 *         schema:
 *           type: integer
 *         description: Maximum manufacturing year
 *         example: 2024
 *       - in: query
 *         name: deliveryAvailable
 *         schema:
 *           type: boolean
 *         description: Filter by delivery availability
 *         example: true
 *       - in: query
 *         name: features
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by feature IDs (array of ObjectIds). Car must have ALL specified features.
 *         example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *     responses:
 *       200:
 *         description: Successfully retrieved rental listings with pagination metadata
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
 *                     $ref: '#/components/schemas/RentalListing'
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
  validate(getRentalListingsQuerySchema, 'query'),
  rentalController.getPublicRentalListingsHandler,
);

/**
 * @swagger
 * /listings/rent/{id}:
 *   get:
 *     summary: Get rental listing by ID
 *     tags: [Rentals]
 *     description: Retrieve detailed information about a specific rental listing. Authentication is optional - if provided, additional user-specific data may be included in the response.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Rental listing ID - must be a valid MongoDB ObjectId
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Successfully retrieved rental listing details
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
 *                       $ref: '#/components/schemas/RentalListing'
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Rental listing not found
 */
router.get(
  '/:id',
  optionalProtect,
  validate(getRentalListingIdSchema, 'params'),
  rentalController.getRentalListingDetailsHandler,
);

router.use(protect);

/**
 * @swagger
 * /listings/rent:
 *   post:
 *     summary: Create a new rental listing
 *     tags: [Rentals]
 *     description: Create a new rental listing for an approved car (requires authentication). The car must be owned by the authenticated user and have an 'approved' status.
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
 *               - ratePerDay
 *               - listingDescription
 *             properties:
 *               car:
 *                 type: string
 *                 description: Car ID - must be a valid MongoDB ObjectId of an approved car owned by the user
 *                 example: 507f1f77bcf86cd799439011
 *               ratePerDay:
 *                 type: number
 *                 minimum: 0
 *                 description: Daily rental rate (REQUIRED)
 *                 example: 2500
 *               ratePerHour:
 *                 type: number
 *                 minimum: 0
 *                 description: Hourly rental rate (optional)
 *                 example: 150
 *               deliveryAvailable:
 *                 type: boolean
 *                 default: false
 *                 description: Whether delivery service is available (optional, defaults to false)
 *                 example: true
 *               deliveryFee:
 *                 type: number
 *                 minimum: 0
 *                 description: Delivery fee - REQUIRED if deliveryAvailable is true, otherwise optional
 *                 example: 300
 *               minRentalDurationDays:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *                 description: Minimum rental duration in days (optional, defaults to 1)
 *                 example: 2
 *               listingDescription:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *                 description: Detailed description of the rental listing (REQUIRED, 10-2000 characters)
 *                 example: "Well maintained sedan, perfect for city driving. Recently serviced with clean interior."
 *     responses:
 *       201:
 *         description: Rental listing created successfully
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
 *                       $ref: '#/components/schemas/RentalListing'
 *       400:
 *         description: Bad request - validation error, car already listed, or deliveryFee missing when deliveryAvailable is true
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - car not approved or not owned by user
 *       404:
 *         description: Car not found
 */
router.post(
  '/',
  validate(createRentalListingSchema, 'body'),
  rentalController.createRentalListingHandler,
);

/**
 * @swagger
 * /listings/rent/manage/my-listings:
 *   get:
 *     summary: Get my rental listings
 *     tags: [Rentals]
 *     description: Retrieve all rental listings owned by the authenticated user, including listings with any status (listed, unlisted, paused)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user's rental listings with count
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
 *                   example: 5
 *                 data:
 *                   type: object
 *                   properties:
 *                     listings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/RentalListing'
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 */
router.get('/manage/my-listings', rentalController.getMyRentalListingsHandler);

/**
 * @swagger
 * /listings/rent/{id}:
 *   patch:
 *     summary: Update a rental listing
 *     tags: [Rentals]
 *     description: Update an existing rental listing (requires authentication and ownership). ALL fields are optional - only send the fields you want to update.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Rental listing ID - must be a valid MongoDB ObjectId
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
 *                 enum: [listed, unlisted, paused]
 *                 description: Listing status (optional)
 *                 example: listed
 *               ratePerDay:
 *                 type: number
 *                 minimum: 0
 *                 description: Daily rental rate (optional)
 *                 example: 2800
 *               ratePerHour:
 *                 type: number
 *                 minimum: 0
 *                 description: Hourly rental rate (optional)
 *                 example: 175
 *               deliveryAvailable:
 *                 type: boolean
 *                 description: Whether delivery service is available (optional)
 *                 example: true
 *               deliveryFee:
 *                 type: number
 *                 minimum: 0
 *                 description: Delivery fee - REQUIRED if setting deliveryAvailable to true
 *                 example: 350
 *               minRentalDurationDays:
 *                 type: integer
 *                 minimum: 1
 *                 description: Minimum rental duration in days (optional)
 *                 example: 3
 *               listingDescription:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *                 description: Listing description (optional, 10-2000 characters if provided)
 *                 example: "Updated description with new features and recent maintenance details"
 *     responses:
 *       200:
 *         description: Rental listing updated successfully
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
 *                       $ref: '#/components/schemas/RentalListing'
 *       400:
 *         description: Bad request - validation error, invalid ID format, or deliveryFee missing when enabling delivery
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - not the owner of this listing
 *       404:
 *         description: Listing not found
 */
router.patch(
  '/:id',
  validate(getRentalListingIdSchema, 'params'),
  validate(updateRentalListingSchema, 'body'),
  rentalController.updateRentalListingHandler,
);

/**
 * @swagger
 * /listings/rent/{id}:
 *   delete:
 *     summary: Delete a rental listing
 *     tags: [Rentals]
 *     description: Delete an existing rental listing (requires authentication and ownership). This permanently removes the listing from the database.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Rental listing ID - must be a valid MongoDB ObjectId
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       204:
 *         description: Rental listing deleted successfully (no content returned, but response includes status:success and data:null)
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
  validate(getRentalListingIdSchema, 'params'),
  rentalController.deleteRentalListingHandler,
);

export default router;
