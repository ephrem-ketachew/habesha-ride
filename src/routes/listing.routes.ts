import { Router } from 'express';
import * as listingController from '../controllers/listing.controller.js';

const router = Router();

/**
 * @swagger
 * /listings/feed:
 *   get:
 *     summary: Get unified listing feed
 *     tags: [Listings]
 *     description: Retrieve a unified, paginated feed of all active rental and sale listings. This endpoint combines rental listings (status:'listed') and sale listings (status:'available'), returning only listings with approved cars. Results are sorted by featured status and creation date. This endpoint is public and does not require authentication.
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
 *           default: 20
 *         description: Number of items per page
 *         example: 20
 *     responses:
 *       200:
 *         description: Successfully retrieved unified listing feed with pagination metadata
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
 *                   description: Array of unified listings (mix of rental and sale listings)
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Listing ID
 *                         example: 507f1f77bcf86cd799439011
 *                       listingType:
 *                         type: string
 *                         enum: [rent, sale]
 *                         description: Type of listing (rent or sale)
 *                         example: rent
 *                       displayPrice:
 *                         type: number
 *                         description: Price to display (ratePerDay for rentals, salePrice for sales)
 *                         example: 2500
 *                       period:
 *                         type: string
 *                         description: Price period ('/day' for rentals, empty string for sales)
 *                         example: /day
 *                       isFeatured:
 *                         type: boolean
 *                         description: Whether this listing is featured
 *                         example: false
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Listing creation timestamp
 *                         example: 2024-01-15T10:30:00Z
 *                       car:
 *                         type: object
 *                         description: Full car details with populated make and model
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: 507f1f77bcf86cd799439012
 *                           make:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                                 example: Toyota
 *                           vehicleModel:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                                 example: Camry
 *                           year:
 *                             type: integer
 *                             example: 2022
 *                           photos:
 *                             type: array
 *                             items:
 *                               type: object
 *                           verificationStatus:
 *                             type: string
 *                             example: approved
 *                       owner:
 *                         type: object
 *                         description: Basic owner information
 *                         properties:
 *                           firstName:
 *                             type: string
 *                             example: John
 *                           lastName:
 *                             type: string
 *                             example: Doe
 *                           profileImage:
 *                             type: string
 *                             example: https://example.com/profile.jpg
 *                 currentPage:
 *                   type: integer
 *                   description: Current page number
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *                   example: 10
 *                 totalResults:
 *                   type: integer
 *                   description: Total number of listings matching the query
 *                   example: 195
 *       400:
 *         description: Bad request - invalid query parameters
 */
router.get('/feed', listingController.getUnifiedListingsHandler);

export default router;
