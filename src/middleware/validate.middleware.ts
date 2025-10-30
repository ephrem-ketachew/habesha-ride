import { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
import AppError from '../utils/appError.util.js';

export const validate =
  (schema: z.ZodObject<any, any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedBody = schema.parse(req.body);

      req.body = validatedBody;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue) => {
          return `${issue.path.join('.')}: ${issue.message}`;
        });

        const message = `Invalid input data. ${errorMessages.join('. ')}`;

        next(new AppError(message, 400));
      } else {
        next(new AppError('Something went wrong during validation.', 500));
      }
    }
  };
