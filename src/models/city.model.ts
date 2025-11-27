/**
 * @swagger
 * components:
 *   schemas:
 *     City:
 *       type: object
 *       required:
 *         - name
 *         - region
 *       properties:
 *         _id:
 *           type: string
 *           description: City ID
 *           example: 507f1f77bcf86cd799439011
 *         name:
 *           type: string
 *           description: City name
 *           example: Addis Ababa
 *         region:
 *           type: string
 *           description: Region or state
 *           example: Addis Ababa
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether this city is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
import mongoose, { Schema } from 'mongoose';
import mongooseSanitize from 'mongoose-sanitize';
import { ICityDocument } from '../types/city.types.js';

const citySchema = new Schema<ICityDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    region: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

citySchema.index({ name: 1 });
citySchema.plugin(mongooseSanitize);

const City = mongoose.model<ICityDocument>('City', citySchema);
export default City;
