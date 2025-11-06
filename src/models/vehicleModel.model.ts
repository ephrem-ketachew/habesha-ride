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
