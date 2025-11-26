/**
 * @swagger
 * components:
 *   schemas:
 *     VehicleModel:
 *       type: object
 *       required:
 *         - name
 *         - make
 *       properties:
 *         _id:
 *           type: string
 *           description: Model ID
 *           example: 507f1f77bcf86cd799439011
 *         name:
 *           type: string
 *           description: Model name
 *           example: Camry
 *         make:
 *           type: string
 *           description: Make (brand) ID
 *           example: 507f1f77bcf86cd799439012
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
import mongoose, { Schema } from 'mongoose';
import mongooseSanitize from 'mongoose-sanitize';
import { IVehicleModelDocument } from '../types/vehicleModel.types.js';

const vehicleModelSchema = new Schema<IVehicleModelDocument>(
  {
    name: { type: String, required: true, trim: true },
    make: {
      type: Schema.Types.ObjectId,
      ref: 'Make',
      required: true,
    },
  },
  { timestamps: true },
);

vehicleModelSchema.index({ make: 1, name: 1 }, { unique: true });
vehicleModelSchema.plugin(mongooseSanitize);

const VehicleModel = mongoose.model<IVehicleModelDocument>(
  'VehicleModel',
  vehicleModelSchema,
);

export default VehicleModel;
