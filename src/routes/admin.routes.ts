import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as adminController from '../controllers/admin.controller.js';
import {
  getCarsAdminSchema,
  updateCarStatusSchema,
  getUsersAdminSchema,
  updateUserStatusSchema,
  getListingsAdminSchema,
  updateSaleListingStatusAdminSchema,
  updateRentalListingStatusAdminSchema,
  getBookingsAdminSchema,
  createModelSchema,
  createMakeSchema,
  updateMakeSchema,
  updateModelSchema,
} from '../validation/admin.validation.js';
import { getCarSchema } from '../validation/car.validation.js';
import { updateUserRoleSchema } from '../validation/admin.validation.js';
import { getUserSchema } from '../validation/user.schema.js';

const router = Router();

router.use(protect, restrictTo('admin', 'superadmin'));

/**
 * @swagger
 * /admin/cars:
 *   get:
 *     summary: Get all cars (Admin view)
 *     tags: [Admin]
 *     description: Retrieve a paginated list of all cars with filtering by status. Requires admin or superadmin role.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter cars by verification status (optional)
 *         example: pending
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
 *     responses:
 *       200:
 *         description: Successfully retrieved cars with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 cars:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Car'
 *                 total:
 *                   type: integer
 *                   description: Total number of cars matching the query
 *                   example: 150
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *                   example: 8
 *       400:
 *         description: Bad request - invalid query parameters
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 */
router.get(
  '/cars',
  validate(getCarsAdminSchema, 'query'),
  adminController.getAllCarsAdminHandler,
);

/**
 * @swagger
 * /admin/cars/{id}/status:
 *   patch:
 *     summary: Update car verification status
 *     tags: [Admin]
 *     description: Update the verification status of a car (approve or reject). Requires admin or superadmin role.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Car ID - must be a valid MongoDB ObjectId
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *                 description: New verification status for the car
 *                 example: approved
 *     responses:
 *       200:
 *         description: Car status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Car status updated to approved.
 *                 data:
 *                   type: object
 *                   properties:
 *                     car:
 *                       $ref: '#/components/schemas/Car'
 *       400:
 *         description: Bad request - invalid ID or status value
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 *       404:
 *         description: Car not found
 */
router.patch(
  '/cars/:id/status',
  validate(getCarSchema, 'params'),
  validate(updateCarStatusSchema, 'body'),
  adminController.updateCarStatusHandler,
);

/**
 * @swagger
 * /admin/users/{id}/role:
 *   patch:
 *     summary: Change user role
 *     tags: [Admin]
 *     description: Change a user's role (user, admin, or superadmin). **Restricted to SUPERADMIN only.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID - must be a valid MongoDB ObjectId
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin, superadmin]
 *                 description: New role to assign to the user
 *                 example: admin
 *     responses:
 *       200:
 *         description: User role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: User role updated to admin.
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: 507f1f77bcf86cd799439011
 *                         email:
 *                           type: string
 *                           example: user@example.com
 *                         role:
 *                           type: string
 *                           example: admin
 *                         fullName:
 *                           type: string
 *                           example: John Doe
 *       400:
 *         description: Bad request - invalid ID or role value
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - superadmin role required
 *       404:
 *         description: User not found
 */
router.patch(
  '/users/:id/role',
  restrictTo('superadmin'),
  validate(getUserSchema, 'params'),
  validate(updateUserRoleSchema, 'body'),
  adminController.updateUserRoleHandler,
);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users (Admin view)
 *     tags: [Admin]
 *     description: Retrieve a paginated list of all users with filtering by role, status, and search. Requires admin or superadmin role.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search users by name or email (optional)
 *         example: john
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin, superadmin]
 *         description: Filter users by role (optional)
 *         example: user
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, blocked]
 *         description: Filter users by status (optional)
 *         example: approved
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
 *     responses:
 *       200:
 *         description: Successfully retrieved users with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 total:
 *                   type: integer
 *                   description: Total number of users matching the query
 *                   example: 500
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *                   example: 25
 *       400:
 *         description: Bad request - invalid query parameters
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 */
router.get(
  '/users',
  validate(getUsersAdminSchema, 'query'),
  adminController.getAllUsersAdminHandler,
);

/**
 * @swagger
 * /admin/users/{id}/status:
 *   patch:
 *     summary: Update user status
 *     tags: [Admin]
 *     description: Update the status of a user (pending, approved, or blocked). Requires admin or superadmin role.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID - must be a valid MongoDB ObjectId
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, blocked]
 *                 description: New status for the user
 *                 example: approved
 *     responses:
 *       200:
 *         description: User status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: User status updated to approved.
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: 507f1f77bcf86cd799439011
 *                         email:
 *                           type: string
 *                           example: user@example.com
 *                         status:
 *                           type: string
 *                           example: approved
 *                         fullName:
 *                           type: string
 *                           example: John Doe
 *       400:
 *         description: Bad request - invalid ID or status value
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 *       404:
 *         description: User not found
 */
router.patch(
  '/users/:id/status',
  validate(getUserSchema, 'params'),
  validate(updateUserStatusSchema, 'body'),
  adminController.updateUserStatusHandler,
);

/**
 * @swagger
 * /admin/listings/rent:
 *   get:
 *     summary: Get all rental listings (Admin view)
 *     tags: [Admin]
 *     description: Retrieve a paginated list of all rental listings with filtering by status. Requires admin or superadmin role.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter listings by status (optional)
 *         example: listed
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
 *                   example: 75
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *                   example: 4
 *       400:
 *         description: Bad request - invalid query parameters
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 */
router.get(
  '/listings/rent',
  validate(getListingsAdminSchema, 'query'),
  adminController.getAllRentalListingsHandler,
);

/**
 * @swagger
 * /admin/listings/rent/{id}/status:
 *   patch:
 *     summary: Update rental listing status
 *     tags: [Admin]
 *     description: Update the status of a rental listing (listed, unlisted, or paused). Requires admin or superadmin role.
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [listed, unlisted, paused]
 *                 description: New status for the rental listing
 *                 example: listed
 *     responses:
 *       200:
 *         description: Rental listing status updated successfully
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
 *         description: Bad request - invalid ID or status value
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 *       404:
 *         description: Rental listing not found
 */
router.patch(
  '/listings/rent/:id/status',
  validate(getCarSchema, 'params'),
  validate(updateRentalListingStatusAdminSchema, 'body'),
  adminController.updateRentalListingStatusHandler,
);

/**
 * @swagger
 * /admin/listings/sale:
 *   get:
 *     summary: Get all sale listings (Admin view)
 *     tags: [Admin]
 *     description: Retrieve a paginated list of all sale listings with filtering by status. Requires admin or superadmin role.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter listings by status (optional)
 *         example: available
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
 *                   example: 120
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *                   example: 6
 *       400:
 *         description: Bad request - invalid query parameters
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 */
router.get(
  '/listings/sale',
  validate(getListingsAdminSchema, 'query'),
  adminController.getAllSaleListingsHandler,
);

/**
 * @swagger
 * /admin/listings/sale/{id}/status:
 *   patch:
 *     summary: Update sale listing status
 *     tags: [Admin]
 *     description: Update the status of a sale listing (available, pending, or sold). Requires admin or superadmin role.
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [available, pending, sold]
 *                 description: New status for the sale listing
 *                 example: available
 *     responses:
 *       200:
 *         description: Sale listing status updated successfully
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
 *         description: Bad request - invalid ID or status value
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 *       404:
 *         description: Sale listing not found
 */
router.patch(
  '/listings/sale/:id/status',
  validate(getCarSchema, 'params'),
  validate(updateSaleListingStatusAdminSchema, 'body'),
  adminController.updateSaleListingStatusHandler,
);

/**
 * @swagger
 * /admin/cars/{id}:
 *   get:
 *     summary: Get car details (Admin view)
 *     tags: [Admin]
 *     description: Retrieve detailed information about a specific car. Requires admin or superadmin role.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Car ID - must be a valid MongoDB ObjectId
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Successfully retrieved car details
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
 *                     car:
 *                       $ref: '#/components/schemas/Car'
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 *       404:
 *         description: Car not found
 */
router.get(
  '/cars/:id',
  validate(getCarSchema, 'params'),
  adminController.getCarDetailsHandler,
);

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Get user details (Admin view)
 *     tags: [Admin]
 *     description: Retrieve detailed information about a specific user with optional pagination for their cars. Requires admin or superadmin role.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID - must be a valid MongoDB ObjectId
 *         example: 507f1f77bcf86cd799439011
 *       - in: query
 *         name: includeCars
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: true
 *         description: Whether to include user's cars in the response
 *         example: true
 *       - in: query
 *         name: carsPage
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for cars pagination (if includeCars is true)
 *         example: 1
 *       - in: query
 *         name: carsLimit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: Number of cars per page (if includeCars is true)
 *         example: 10
 *     responses:
 *       200:
 *         description: Successfully retrieved user details with optional cars
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
 *                   description: Contains user data and optionally cars with pagination
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 *       404:
 *         description: User not found
 */
router.get(
  '/users/:id',
  validate(getUserSchema, 'params'),
  adminController.getUserDetailsHandler,
);

/**
 * @swagger
 * /admin/listings/rent/{id}:
 *   get:
 *     summary: Get rental listing details (Admin view)
 *     tags: [Admin]
 *     description: Retrieve detailed information about a specific rental listing. Requires admin or superadmin role.
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
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 *       404:
 *         description: Rental listing not found
 */
router.get(
  '/listings/rent/:id',
  validate(getCarSchema, 'params'),
  adminController.getRentalListingDetailsHandler,
);

/**
 * @swagger
 * /admin/listings/sale/{id}:
 *   get:
 *     summary: Get sale listing details (Admin view)
 *     tags: [Admin]
 *     description: Retrieve detailed information about a specific sale listing. Requires admin or superadmin role.
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
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 *       404:
 *         description: Sale listing not found
 */
router.get(
  '/listings/sale/:id',
  validate(getCarSchema, 'params'),
  adminController.getSaleListingDetailsHandler,
);

/**
 * @swagger
 * /admin/bookings:
 *   get:
 *     summary: Get all bookings (Admin view)
 *     tags: [Admin]
 *     description: Retrieve a paginated list of all bookings. Requires admin or superadmin role.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, active, completed, cancelled, rejected]
 *         description: Filter bookings by booking status (optional)
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [pending, paid, refunded, failed]
 *         description: Filter bookings by payment status (optional)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page (max 100)
 *     responses:
 *       200:
 *         description: Successfully retrieved bookings with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 bookings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *                 total:
 *                   type: integer
 *                   description: Total number of bookings matching the query
 *                   example: 120
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *                   example: 6
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 */
router.get(
  '/bookings',
  validate(getBookingsAdminSchema, 'query'),
  adminController.getAllBookingsAdminHandler,
);

/**
 * @swagger
 * /admin/bookings/{id}:
 *   get:
 *     summary: Get booking details (Admin view)
 *     tags: [Admin]
 *     description: Retrieve detailed information about a specific booking. Requires admin or superadmin role.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID - must be a valid MongoDB ObjectId
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Successfully retrieved booking details
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
 *                     booking:
 *                       $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Bad request - invalid ID format
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 *       404:
 *         description: Booking not found
 */
router.get(
  '/bookings/:id',
  validate(getCarSchema, 'params'),
  adminController.getBookingDetailsAdminHandler,
);

/**
 * @swagger
 * /admin/makes:
 *   post:
 *     summary: Create a new car make (brand)
 *     tags: [Admin]
 *     description: Create a new car make/brand in the system. Requires admin or superadmin role.
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
 *                 minLength: 1
 *                 description: Name of the car make/brand (REQUIRED)
 *                 example: Toyota
 *               logoUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL to the brand logo (optional)
 *                 example: https://example.com/logos/toyota.png
 *     responses:
 *       201:
 *         description: Car make created successfully
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
 *                     make:
 *                       $ref: '#/components/schemas/Make'
 *       400:
 *         description: Bad request - validation error or make already exists
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 */
router.post(
  '/makes',
  validate(createMakeSchema, 'body'),
  adminController.createMakeHandler,
);

/**
 * @swagger
 * /admin/models:
 *   post:
 *     summary: Create a new car model
 *     tags: [Admin]
 *     description: Create a new car model for a specific make/brand. Requires admin or superadmin role.
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
 *               - make
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 description: Name of the car model (REQUIRED)
 *                 example: Camry
 *               make:
 *                 type: string
 *                 description: Make/brand ID - must be a valid MongoDB ObjectId (REQUIRED)
 *                 example: 507f1f77bcf86cd799439011
 *     responses:
 *       201:
 *         description: Car model created successfully
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
 *                     model:
 *                       $ref: '#/components/schemas/VehicleModel'
 *       400:
 *         description: Bad request - validation error, invalid Make ID, or model already exists
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 *       404:
 *         description: Make not found
 */
router.post(
  '/models',
  validate(createModelSchema, 'body'),
  adminController.createModelHandler,
);

/**
 * @swagger
 * /admin/makes/{id}:
 *   patch:
 *     summary: Update a car make (brand)
 *     tags: [Admin]
 *     description: Update an existing car make/brand. ALL fields are optional - only send the fields you want to update. Requires admin or superadmin role.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Make ID - must be a valid MongoDB ObjectId
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 description: Name of the car make/brand (optional)
 *                 example: Toyota Motors
 *               logoUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL to the brand logo (optional)
 *                 example: https://example.com/logos/toyota-updated.png
 *     responses:
 *       200:
 *         description: Car make updated successfully
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
 *                     make:
 *                       $ref: '#/components/schemas/Make'
 *       400:
 *         description: Bad request - validation error or invalid ID format
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 *       404:
 *         description: Make not found
 */
router.patch(
  '/makes/:id',
  validate(getCarSchema, 'params'),
  validate(updateMakeSchema, 'body'),
  adminController.updateMakeHandler,
);

/**
 * @swagger
 * /admin/models/{id}:
 *   patch:
 *     summary: Update a car model
 *     tags: [Admin]
 *     description: Update an existing car model. ALL fields are optional - only send the fields you want to update. Requires admin or superadmin role.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Model ID - must be a valid MongoDB ObjectId
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 description: Name of the car model (optional)
 *                 example: Camry Hybrid
 *     responses:
 *       200:
 *         description: Car model updated successfully
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
 *                     model:
 *                       $ref: '#/components/schemas/VehicleModel'
 *       400:
 *         description: Bad request - validation error or invalid ID format
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 *       404:
 *         description: Model not found
 */
router.patch(
  '/models/:id',
  validate(getCarSchema, 'params'),
  validate(updateModelSchema, 'body'),
  adminController.updateModelHandler,
);

/**
 * @swagger
 * /admin/makes/{id}:
 *   delete:
 *     summary: Delete a car make (brand)
 *     tags: [Admin]
 *     description: Delete an existing car make/brand. This will also affect all models and cars associated with this make. Requires admin or superadmin role.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Make ID - must be a valid MongoDB ObjectId
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       204:
 *         description: Car make deleted successfully (no content returned, but response includes status:success and data:null)
 *       400:
 *         description: Bad request - invalid ID format or make has associated models
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 *       404:
 *         description: Make not found
 */
router.delete(
  '/makes/:id',
  validate(getCarSchema, 'params'),
  adminController.deleteMakeHandler,
);

/**
 * @swagger
 * /admin/models/{id}:
 *   delete:
 *     summary: Delete a car model
 *     tags: [Admin]
 *     description: Delete an existing car model. This will affect all cars associated with this model. Requires admin or superadmin role.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Model ID - must be a valid MongoDB ObjectId
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       204:
 *         description: Car model deleted successfully (no content returned, but response includes status:success and data:null)
 *       400:
 *         description: Bad request - invalid ID format or model has associated cars
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - admin or superadmin role required
 *       404:
 *         description: Model not found
 */
router.delete(
  '/models/:id',
  validate(getCarSchema, 'params'),
  adminController.deleteModelHandler,
);

export default router;
