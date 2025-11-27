/**
 * @swagger
 * components:
 *   schemas:
 *     Feature:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: Feature ID
 *           example: 507f1f77bcf86cd799439011
 *         name:
 *           type: string
 *           description: Feature name
 *           example: Air Conditioning
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether this feature is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
import mongoose, { Schema } from 'mongoose';
import mongooseSanitize from 'mongoose-sanitize';
import { IFeatureDocument } from '../types/feature.types.js';

const featureSchema = new Schema<IFeatureDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

featureSchema.index({ name: 1 });
featureSchema.plugin(mongooseSanitize);

const Feature = mongoose.model<IFeatureDocument>('Feature', featureSchema);
export default Feature;
