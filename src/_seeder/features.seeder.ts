import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/env.config.js';
import Feature from '../models/feature.model.js';
import logger from '../config/logger.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectDB = async () => {
  const dbUrlTemplate = config.mongo.uriTemplate;
  const dbPassword = config.mongo.password;
  const dbUrl = dbUrlTemplate.replace('<PASSWORD>', dbPassword);

  try {
    await mongoose.connect(dbUrl);
    logger.info('MongoDB Connected for Seeder...');
  } catch (err: any) {
    logger.error(`Seeder DB Connection Error: ${err.message}`);
    process.exit(1);
  }
};

let featuresData: any[] = [];
try {
  const jsonPath = path.resolve(__dirname, '../_data/features.json');
  featuresData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
} catch (err) {
  logger.error(`Failed to read _data/features.json: ${err}`);
  process.exit(1);
}

logger.info(`Loaded ${featuresData.length} features from features.json`);

const importData = async () => {
  try {
    await Feature.deleteMany();
    logger.info('Old data destroyed...');

    const featuresToInsert = featuresData.map((item) => ({
      name: item.name,
      isActive: item.isActive !== undefined ? item.isActive : true,
    }));

    if (featuresToInsert.length > 0) {
      await Feature.insertMany(featuresToInsert);
    }

    logger.info(
      `Data Imported Successfully! ${featuresToInsert.length} features added.`,
    );
    process.exit(0);
  } catch (err: any) {
    logger.error(`Data Import Error: ${err.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Feature.deleteMany();
    logger.info('Data Destroyed Successfully!');
    process.exit(0);
  } catch (err: any) {
    logger.error(`Data Destroy Error: ${err.message}`);
    process.exit(1);
  }
};

const run = async () => {
  await connectDB();

  if (process.argv[2] === '-d') {
    await destroyData();
  } else {
    await importData();
  }
};

run();
