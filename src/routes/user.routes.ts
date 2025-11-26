
import { Router } from 'express';
import { protect } from "../middleware/auth.middleware.js";
import { userProfile,
         updateProfileHandler
 } from "../controllers/user.controller.js";
 import { updateMeSchema } from '../validation/user.schema.js';
 import { validate } from '../middleware/validate.middleware.js';


const router = Router();

/**
 * @swagger
 * /user/userProfile:
 *   get:
 *     summary: Get my profile
 *     tags: [Users]
 *     description: Retrieve the authenticated user's complete profile information including personal details, verification status, and role.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 */
router.get('/userProfile', protect, userProfile);

/**
 * @swagger
 * /user/updateProfile:
 *   patch:
 *     summary: Update my profile
 *     tags: [Users]
 *     description: Update the authenticated user's profile information. ALL fields are optional - only send the fields you want to update. Names are automatically sanitized and capitalized. Sensitive fields (password, role, status, etc.) are automatically filtered out if sent.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: User's first name (optional, automatically capitalized)
 *                 example: John
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: User's last name (optional, automatically capitalized)
 *                 example: Doe
 *               phoneNumber:
 *                 type: string
 *                 pattern: '^[0-9]{7,15}$'
 *                 description: Phone number with 7-15 digits only, no special characters (optional)
 *                 example: "251911234567"
 *     responses:
 *       200:
 *         description: Profile updated successfully with the updated user object
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request - validation error (invalid phone format, name too short/long, etc.)
 *       401:
 *         description: Unauthorized - valid JWT cookie required
 */
router.patch('/updateProfile', protect, validate(updateMeSchema), updateProfileHandler);

export default router;
