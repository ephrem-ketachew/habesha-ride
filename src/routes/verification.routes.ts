import { Router } from 'express';
import {
  initiateFaydaVerificationHandler,
  handleFaydaCallbackHandler,
  getVerificationStatusHandler,
  revokeVerificationHandler,
  verifyPassportHandler,
  verifyLicenseHandler,
} from '../controllers/verification.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  faydaCallbackSchema,
  revokePassportVerificationParamsSchema,
  licenseVerificationBodySchema,
  revokeLicenseVerificationParamsSchema,
} from '../validation/verification.schema.js';
import { protect } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/auth.middleware.js';
import {
  uploadPassportImages,
  validatePassportImages,
  uploadLicenseImages,
  validateLicenseImages,
  handleMulterError,
} from '../utils/multer.util.js';
import {
  passportVerificationLimiter,
  licenseVerificationLimiter,
} from '../middleware/rateLimiter.middleware.js';

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
 *                       $ref: '#/components/schemas/UserVerificationData'
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
 * /verification/passport:
 *   post:
 *     summary: Verify identity via passport (foreigners)
 *     tags: [Verification]
 *     description: |
 *       Verifies identity using passport and selfie images.
 *       Uses Google Cloud Vision for OCR, MRZ parsing, and AWS Rekognition for facial matching.
 *
 *       **Process:**
 *       1. Upload passport data page + live selfie
 *       2. OCR extracts passport data (name, DOB, nationality, etc.)
 *       3. MRZ validation with checksum verification
 *       4. Facial comparison (passport photo vs. selfie)
 *       5. Automated approval if all validations pass
 *
 *       **Validation Criteria:**
 *       - Valid MRZ checksums
 *       - Passport not expired
 *       - User is 18+ years old
 *       - Face match similarity > 90%
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - passportImage
 *               - selfieImage
 *             properties:
 *               passportImage:
 *                 type: string
 *                 format: binary
 *                 description: Passport data page image (JPEG/PNG, max 5MB)
 *               selfieImage:
 *                 type: string
 *                 format: binary
 *                 description: Live selfie photo (JPEG/PNG, max 5MB)
 *     responses:
 *       200:
 *         description: Verification processed (check data.approved for result)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [success, rejected]
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     approved:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: Identity verified successfully via passport
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         isIdentityVerified:
 *                           type: boolean
 *                         identityVerificationMethod:
 *                           type: string
 *                           enum: [passport]
 *                         identityVerifiedAt:
 *                           type: string
 *                           format: date-time
 *                         passportData:
 *                           $ref: '#/components/schemas/PassportData'
 *                     validations:
 *                       type: object
 *                       properties:
 *                         mrzValid:
 *                           type: boolean
 *                         notExpired:
 *                           type: boolean
 *                         ageValid:
 *                           type: boolean
 *                         faceMatch:
 *                           type: boolean
 *                     biometricResult:
 *                       type: object
 *                       properties:
 *                         similarity:
 *                           type: number
 *                           example: 95.5
 *                         faceMatches:
 *                           type: boolean
 *                         confidence:
 *                           type: number
 *       400:
 *         description: Invalid request (missing files, wrong format, user already verified)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   examples:
 *                     - Both passport image and selfie image are required
 *                     - Invalid file type. Only JPEG and PNG images are allowed
 *                     - Your identity is already verified via fayda
 *                     - Could not detect MRZ. Please ensure photo is clear
 *                     - No face detected in selfie
 *       401:
 *         description: Not authenticated
 *       409:
 *         description: Passport already registered in the system
 *       413:
 *         description: File too large (max 5MB per image)
 *       500:
 *         description: Server error (OCR/face comparison API failed)
 */
router.post(
  '/passport',
  passportVerificationLimiter,
  protect,
  uploadPassportImages,
  validatePassportImages,
  verifyPassportHandler,
);

/**
 * @swagger
 * /verification/license:
 *   post:
 *     summary: Verify driver license
 *     tags: [Verification]
 *     description: |
 *       Verifies driver license using OCR and matches with identity data.
 *       **Prerequisites:** User must have completed identity verification (Fayda or Passport) first.
 *
 *       **Process:**
 *       1. Upload license images (front required, back optional)
 *       2. OCR extracts license data (number, name, DOB, expiry, classes)
 *       3. Matches name (fuzzy ≥85%) and DOB (exact) with identity data
 *       4. Validates expiry (must be valid for 3+ months)
 *       5. Validates license class (B, C, D, or E required)
 *       6. Automated approval if all validations pass
 *
 *       **Supported Licenses:**
 *       - Ethiopian driver licenses (with Amharic text)
 *       - International driving permits (IDP)
 *       - Foreign driver licenses
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - frontImage
 *               - licenseType
 *             properties:
 *               frontImage:
 *                 type: string
 *                 format: binary
 *                 description: Front of license (JPEG/PNG, max 5MB)
 *               backImage:
 *                 type: string
 *                 format: binary
 *                 description: Back of license (optional, JPEG/PNG, max 5MB)
 *               licenseType:
 *                 type: string
 *                 enum: [ethiopian, international]
 *                 description: Type of license
 *                 example: ethiopian
 *     responses:
 *       200:
 *         description: Verification processed (check data.approved for result)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [success, rejected]
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     approved:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: License verified successfully
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         isDrivingLicenseVerified:
 *                           type: boolean
 *                           example: true
 *                         licenseVerifiedAt:
 *                           type: string
 *                           format: date-time
 *                         licenseData:
 *                           $ref: '#/components/schemas/LicenseData'
 *                     validations:
 *                       type: object
 *                       properties:
 *                         ocrSuccess:
 *                           type: boolean
 *                         notExpired:
 *                           type: boolean
 *                         nameMatch:
 *                           type: boolean
 *                         dobMatch:
 *                           type: boolean
 *                         licenseClassValid:
 *                           type: boolean
 *                     matchingResult:
 *                       type: object
 *                       properties:
 *                         nameMatchScore:
 *                           type: number
 *                           example: 95.5
 *                         dobMatch:
 *                           type: boolean
 *                         identitySource:
 *                           type: string
 *                           enum: [fayda, passport]
 *       400:
 *         description: Invalid request (missing files, wrong format, already verified)
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Identity not verified (prerequisite)
 *       409:
 *         description: License already registered in the system
 *       413:
 *         description: File too large (max 5MB per image)
 *       429:
 *         description: Too many attempts (max 5 per 15 minutes)
 *       500:
 *         description: Server error (OCR API failed)
 */
router.post(
  '/license',
  licenseVerificationLimiter,
  protect,
  uploadLicenseImages,
  validateLicenseImages,
  validate(licenseVerificationBodySchema, 'body'),
  verifyLicenseHandler,
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
 *                   $ref: '#/components/schemas/VerificationStatus'
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
  validate(revokePassportVerificationParamsSchema, 'params'),
  revokeVerificationHandler,
);

/**
 * @swagger
 * /verification/passport/{userId}:
 *   delete:
 *     summary: Revoke passport verification (Admin only)
 *     tags: [Verification]
 *     description: Revokes passport identity verification for a user. Clears all passport data. Admin/Superadmin only.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to revoke passport verification for
 *     responses:
 *       200:
 *         description: Passport verification revoked successfully
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
 *                     message:
 *                       type: string
 *                       example: Passport verification revoked successfully
 *       400:
 *         description: User is not verified or not verified via passport
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (Admin only)
 *       404:
 *         description: User not found
 */
router.delete(
  '/passport/:userId',
  protect,
  restrictTo('admin', 'superadmin'),
  validate(revokePassportVerificationParamsSchema, 'params'),
  revokeVerificationHandler,
);

/**
 * @swagger
 * /verification/license/{userId}:
 *   delete:
 *     summary: Revoke license verification (Admin only)
 *     tags: [Verification]
 *     description: |
 *       Revokes license verification for a user. Clears all license data.
 *       Admin/Superadmin only.
 *
 *       **Note:** This also revokes identity verification (Fayda/Passport) as license
 *       requires identity as a prerequisite. User must re-verify identity before
 *       verifying license again.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to revoke license verification for
 *     responses:
 *       200:
 *         description: License verification revoked successfully
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
 *                     message:
 *                       type: string
 *                       examples:
 *                         - License verification revoked successfully
 *                         - Fayda and License verification revoked successfully
 *       400:
 *         description: User has no active verifications to revoke
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (Admin only)
 *       404:
 *         description: User not found
 */
router.delete(
  '/license/:userId',
  protect,
  restrictTo('admin', 'superadmin'),
  validate(revokeLicenseVerificationParamsSchema, 'params'),
  revokeVerificationHandler,
);

export default router;
