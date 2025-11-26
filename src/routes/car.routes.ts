import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { upload } from '../utils/fileUpload.util.js';
import * as carController from '../controllers/car.controller.js';
import { getCarSchema } from '../validation/car.validation.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

router.use(protect);

/**
 * @swagger
 * /cars:
 *   post:
 *     summary: Create a new car
 *     tags: [Cars]
 *     description: Add a new car with photos to the platform (requires authentication). Uses multipart/form-data for file uploads. At least 1 photo is required.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - make
 *               - vehicleModel
 *               - year
 *               - licensePlate
 *               - address
 *               - city
 *               - photos
 *             properties:
 *               make:
 *                 type: string
 *                 description: Make (brand) ID - must be valid MongoDB ObjectId
 *                 example: 507f1f77bcf86cd799439011
 *               vehicleModel:
 *                 type: string
 *                 description: Model ID - must be valid MongoDB ObjectId
 *                 example: 507f1f77bcf86cd799439012
 *               year:
 *                 type: integer
 *                 minimum: 1900
 *                 maximum: 2026
 *                 description: Manufacturing year (1900 to current year + 1)
 *                 example: 2022
 *               licensePlate:
 *                 type: string
 *                 description: Vehicle license plate number
 *                 example: AA-12345
 *               address:
 *                 type: string
 *                 description: Street address of car's home location (REQUIRED - sent as separate field, not nested)
 *                 example: Bole Road, near Mexican Embassy
 *               city:
 *                 type: string
 *                 description: City where car is located (REQUIRED - sent as separate field, not nested)
 *                 example: Addis Ababa
 *               vin:
 *                 type: string
 *                 description: Vehicle Identification Number (optional)
 *                 example: 1HGBH41JXMN109186
 *               bodyType:
 *                 type: string
 *                 enum: [sedan, suv, truck, hatchback, coupe, van, other]
 *                 description: Body type of vehicle (optional)
 *                 example: sedan
 *               color:
 *                 type: string
 *                 description: Vehicle color (optional)
 *                 example: Black
 *               transmission:
 *                 type: string
 *                 enum: [automatic, manual]
 *                 description: Transmission type (optional)
 *                 example: automatic
 *               fuelType:
 *                 type: string
 *                 enum: [gasoline, diesel, electric, hybrid]
 *                 description: Fuel type (optional)
 *                 example: gasoline
 *               seatingCapacity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Number of seats (optional)
 *                 example: 5
 *               mileage:
 *                 type: number
 *                 minimum: 0
 *                 description: Current mileage in kilometers (optional)
 *                 example: 45000
 *               features:
 *                 type: string
 *                 description: Car features as comma-separated string OR single feature (optional, automatically converted to array)
 *                 example: "Air Conditioning,Bluetooth,Backup Camera"
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 minItems: 1
 *                 maxItems: 10
 *                 description: Car photos (REQUIRED - minimum 1, maximum 10 images)
 *     responses:
 *       201:
 *         description: Car created successfully with uploaded photos
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
 *         description: Validation error - missing required fields, no photos uploaded, or invalid data (uploaded photos are automatically deleted on error)
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 */
router.post('/', upload.array('photos', 10), carController.createCarHandler);

/**
 * @swagger
 * /cars/my-cars:
 *   get:
 *     summary: Get my cars
 *     tags: [Cars]
 *     description: Retrieve all cars owned by the authenticated user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user's cars with count
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
 *                   description: Number of cars returned
 *                   example: 3
 *                 data:
 *                   type: object
 *                   properties:
 *                     cars:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Car'
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 */
router.get('/my-cars', carController.getMyCarsHandler);

/**
 * @swagger
 * /cars/{id}:
 *   get:
 *     summary: Get car by ID
 *     tags: [Cars]
 *     description: Retrieve detailed information about a specific car. User must be the owner of the car.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Car ID (must be a valid MongoDB ObjectId)
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
 *         description: Forbidden - not the owner of this car
 *       404:
 *         description: Car not found
 */
router.get(
  '/:id',
  validate(getCarSchema, 'params'),
  carController.getCarHandler,
);

/**
 * @swagger
 * /cars/{id}:
 *   patch:
 *     summary: Update a car
 *     tags: [Cars]
 *     description: Update an existing car with optional photo management (requires authentication and ownership). Uses multipart/form-data. ALL fields are optional - only send what you want to update.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Car ID (must be a valid MongoDB ObjectId)
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               make:
 *                 type: string
 *                 description: Make (brand) ID (optional)
 *                 example: 507f1f77bcf86cd799439011
 *               vehicleModel:
 *                 type: string
 *                 description: Model ID (optional)
 *                 example: 507f1f77bcf86cd799439012
 *               year:
 *                 type: integer
 *                 minimum: 1900
 *                 description: Manufacturing year (optional)
 *                 example: 2023
 *               licensePlate:
 *                 type: string
 *                 description: License plate number (optional)
 *                 example: AA-54321
 *               address:
 *                 type: string
 *                 description: Street address (optional - send as separate field)
 *                 example: Kazanchis, near Sheraton Hotel
 *               city:
 *                 type: string
 *                 description: City (optional - send as separate field)
 *                 example: Addis Ababa
 *               vin:
 *                 type: string
 *                 description: Vehicle Identification Number (optional)
 *                 example: 1HGBH41JXMN109186
 *               bodyType:
 *                 type: string
 *                 enum: [sedan, suv, truck, hatchback, coupe, van, other]
 *                 description: Body type (optional)
 *                 example: suv
 *               color:
 *                 type: string
 *                 description: Vehicle color (optional)
 *                 example: White
 *               transmission:
 *                 type: string
 *                 enum: [automatic, manual]
 *                 description: Transmission type (optional)
 *                 example: automatic
 *               fuelType:
 *                 type: string
 *                 enum: [gasoline, diesel, electric, hybrid]
 *                 description: Fuel type (optional)
 *                 example: hybrid
 *               seatingCapacity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Number of seats (optional)
 *                 example: 7
 *               mileage:
 *                 type: number
 *                 minimum: 0
 *                 description: Current mileage (optional)
 *                 example: 50000
 *               features:
 *                 type: string
 *                 description: Features as comma-separated string (optional)
 *                 example: "Air Conditioning,Sunroof,Leather Seats"
 *               photosToDelete:
 *                 type: string
 *                 description: Comma-separated Cloudinary public IDs of photos to delete OR single photo ID (optional)
 *                 example: "cars/photo1_abc123,cars/photo2_def456"
 *               primaryPhoto:
 *                 type: string
 *                 description: Cloudinary public ID of photo to set as primary (optional)
 *                 example: cars/photo3_ghi789
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 10
 *                 description: New photos to add (optional, max 10 total photos per car)
 *     responses:
 *       200:
 *         description: Car updated successfully (if validation fails after upload, new photos are automatically deleted)
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
 *         description: Validation error or invalid ID format
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - not the owner of this car
 *       404:
 *         description: Car not found
 */
router.patch(
  '/:id',
  validate(getCarSchema, 'params'),
  upload.array('photos', 10),
  carController.updateCarHandler,
);

/**
 * @swagger
 * /cars/{id}:
 *   delete:
 *     summary: Delete a car
 *     tags: [Cars]
 *     description: Delete an existing car and all associated photos from Cloudinary (requires authentication and ownership)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Car ID (must be a valid MongoDB ObjectId)
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       204:
 *         description: Car deleted successfully (no content returned, but response includes status:success and data:null)
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 *       403:
 *         description: Forbidden - not the owner of this car
 *       404:
 *         description: Car not found
 */
router.delete(
  '/:id',
  validate(getCarSchema, 'params'),
  carController.deleteCarHandler,
);

export default router;
