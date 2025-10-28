import mongoose from 'mongoose';
import logger from './logger.config.js';
import AppError from '../utils/appError.util.js';
import config from './env.config.js';

const connectDB = async (): Promise<void> => {
  const dbUrlTemplate = config.mongo.uriTemplate;
  const dbPassword = config.mongo.password;
  const dbUrl = dbUrlTemplate.replace('<PASSWORD>', dbPassword);

  try {
    await mongoose.connect(dbUrl);
    logger.info('[Database]: MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      logger.error(`[Database]: Connection error: ${err}`);
    });
    mongoose.connection.on('disconnected', () => {
      logger.warn('[Database]: Connection disconnected');
    });
  } catch (err: any) {
    logger.error('💥 DATABASE CONNECTION FAILED!', err);
    throw new AppError(`Database connection failed: ${err.message}`, 500);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close(false);
    logger.info('[Database]: Connection closed gracefully.');
  } catch (err) {
    logger.error({ err }, '[Database]: Error closing connection.');
  }
};

export default connectDB;
