import mongoose, { Schema } from 'mongoose';
import mongooseSanitize from 'mongoose-sanitize';
import { IMakeDocument } from '../types/make.types.js';

const makeSchema = new Schema<IMakeDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    logoUrl: { type: String },
  },
  { timestamps: true },
);

makeSchema.index({ name: 1 });
makeSchema.plugin(mongooseSanitize);

const Make = mongoose.model<IMakeDocument>('Make', makeSchema);
export default Make;
