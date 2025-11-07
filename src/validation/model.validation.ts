import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdSchema = z.string().refine(
  (val) => {
    return mongoose.Types.ObjectId.isValid(val);
  },
  { message: 'Invalid Make ID format.' },
);

export const getModelsByMakeSchema = z.object({
  make: objectIdSchema,
});

export type GetModelsByMakeQuery = z.infer<typeof getModelsByMakeSchema>;
