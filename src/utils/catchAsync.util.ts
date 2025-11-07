import { Request, Response, NextFunction } from 'express';
import {
  getPublicIdsFromFiles,
  deleteCloudinaryResources,
} from './cloudinary.util.js';

type AsyncController = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<any>;

const catchAsync = (fn: AsyncController) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(async (err: any) => {
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        const publicIds = getPublicIdsFromFiles(
          req.files as Express.Multer.File[],
        );
        await deleteCloudinaryResources(publicIds);
      }

      next(err);
    });
  };
};

export default catchAsync;
