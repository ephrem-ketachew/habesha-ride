import { Router } from 'express';
import {
  initiateFaydaVerificationHandler,
  handleFaydaCallbackHandler,
  getVerificationStatusHandler,
  revokeVerificationHandler,
} from '../controllers/verification.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { faydaCallbackSchema } from '../validation/verification.schema.js';
import { protect } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /verification/fayda/initiate:
 *   post:
 *     summary: Initiate Fayda identity verification
 *     tags: [Verification]
 *     description: Generates PKCE parameters and returns authorization URL for Fayda OIDC flow
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Authorization URL generated successfully
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
 *                     authorizationUrl:
 *                       type: string
 *                       description: URL to redirect user to for Fayda authentication
 *                       example: https://esignet.authorization.endpoint/authorize?client_id=...
 *                     state:
 *                       type: string
 *                       description: CSRF state token (also stored in httpOnly cookie)
 *                     expiresIn:
 *                       type: number
 *                       description: Expiration time in seconds
 *                       example: 600
 *       400:
 *         description: User already verified
 *       401:
 *         description: Not authenticated
 */
router.post('/fayda/initiate', protect, initiateFaydaVerificationHandler);

/**
 * @swagger
 * /verification/fayda/callback:
 *   post:
 *     summary: Handle Fayda OAuth callback
 *     tags: [Verification]
 *     description: Processes authorization code from Fayda, exchanges for tokens, retrieves userinfo, and updates user identity
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - state
 *             properties:
 *               code:
 *                 type: string
 *                 description: Authorization code from Fayda
 *                 example: "4/0AY0e-g7..."
 *               state:
 *                 type: string
 *                 description: State token (must match stored state)
 *     responses:
 *       200:
 *         description: Identity verified successfully
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
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         isIdentityVerified:
 *                           type: boolean
 *                         identityVerificationMethod:
 *                           type: string
 *                           example: fayda
 *                         faydaData:
 *                           type: object
 *                     message:
 *                       type: string
 *                       example: Identity verified successfully
 *       400:
 *         description: Invalid authorization code, expired state, or user already verified
 *       401:
 *         description: Invalid or missing state token
 *       409:
 *         description: Fayda ID already linked to another account
 */
router.post(
  '/fayda/callback',
  protect,
  validate(faydaCallbackSchema, 'body'),
  handleFaydaCallbackHandler,
);

/**
 * @swagger
 * /verification/status:
 *   get:
 *     summary: Get verification status
 *     tags: [Verification]
 *     description: Returns the current identity verification status for the authenticated user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Verification status retrieved successfully
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
 *                     isIdentityVerified:
 *                       type: boolean
 *                     identityVerificationMethod:
 *                       type: string
 *                       nullable: true
 *                       example: fayda
 *                     identityVerifiedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     faydaId:
 *                       type: string
 *                       nullable: true
 *                     faydaData:
 *                       type: object
 *                       nullable: true
 *       401:
 *         description: Not authenticated
 */
router.get('/status', protect, getVerificationStatusHandler);

/**
 * @swagger
 * /verification/fayda/{userId}:
 *   delete:
 *     summary: Revoke verification (Admin only)
 *     tags: [Verification]
 *     description: Revokes identity verification for a user. Admin/Superadmin only.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to revoke verification for
 *     responses:
 *       200:
 *         description: Verification revoked successfully
 *       400:
 *         description: User is not verified
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (Admin only)
 */
router.delete(
  '/fayda/:userId',
  protect,
  restrictTo('admin', 'superadmin'),
  revokeVerificationHandler,
);

export default router;
