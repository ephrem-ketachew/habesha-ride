import { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
import AppError from '../utils/appError.util.js';

type ReqPart = 'body' | 'query' | 'params';

declare global {
  namespace Express {
    interface Request {
      validatedQuery?: any;
      validatedParams?: any;
    }
  }
}

export const validate =
  (schema: z.ZodObject<any, any>, part: ReqPart = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req[part]);

      if (part === 'body') {
        req.body = validated;
      } else if (part === 'query') {
        Object.assign(req.query, validated);
        req.validatedQuery = validated;
      } else if (part === 'params') {
        Object.assign(req.params, validated);
        req.validatedParams = validated;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue) => {
          return `${issue.path.join('.')}: ${issue.message}`;
        });
        const message = `Invalid input data. ${errorMessages.join('. ')}`;
        next(new AppError(message, 400));
      } else {
        console.error('Validation Middleware Error:', error);
        next(new AppError('Something went wrong during validation.', 500));
      }
    }
  };
