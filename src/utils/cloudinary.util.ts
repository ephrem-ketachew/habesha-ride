import { v2 as cloudinary } from 'cloudinary';
import config from '../config/env.config.js';
import logger from '../config/logger.config.js';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export const getPublicIdsFromFiles = (
  files: Express.Multer.File[],
): string[] => {
  if (!files || files.length === 0) {
    return [];
  }

  return files.map((file) => file.filename).filter(Boolean);
};

export const deleteCloudinaryResources = async (publicIds: string[]) => {
  if (!publicIds || publicIds.length === 0) return;

  logger.warn(`[Rollback]: Deleting ${publicIds.length} orphaned files...`);
  try {
    await cloudinary.api.delete_resources(publicIds);
    logger.info('[Rollback]: Orphaned files deleted successfully.');
  } catch (error: any) {
    logger.error(error, '[Rollback]: Error deleting files from Cloudinary');
  }
};

export { cloudinary };
