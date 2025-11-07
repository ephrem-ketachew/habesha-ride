import { cloudinary } from './cloudinary.util.js';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import AppError from './appError.util.js';
import { Request } from 'express';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: Request, file: Express.Multer.File) => {
    const userId = req.user?.id || 'misc';
    const folder = `kech/cars/${userId}`;

    const filename = `car-${userId}-${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}`;

    return {
      folder: folder,
      public_id: filename,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { width: 1024, height: 768, crop: 'limit' },
        { quality: 'auto:good' },
      ],
    };
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400) as any);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
