import { z } from 'zod';

export const faydaCallbackSchema = z
  .object({
    code: z.string().min(1, 'Authorization code is required'),
    state: z.string().min(1, 'State token is required'),
  })
  .strict();

export type FaydaCallbackInput = z.infer<typeof faydaCallbackSchema>;
