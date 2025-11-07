import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/env.config.js';
import Make from '../models/make.model.js';
import VehicleModel from '../models/vehicleModel.model.js';
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

let carsData: any[] = [];
try {
  const jsonPath = path.resolve(__dirname, '../_data/cars.json');
  carsData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
} catch (err) {
  logger.error(`Failed to read _data/cars.json: ${err}`);
  process.exit(1);
}
logger.info(`Loaded ${carsData.length} makes from cars.json`);
const importData = async () => {
  try {
    await Make.deleteMany();
    await VehicleModel.deleteMany();

    logger.info('Old data destroyed...');

    for (const makeData of carsData) {
      const makeName = makeData.title;

      const newMake = new Make({ name: makeName });
      await newMake.save();

      const modelsToCreate = makeData.models.map((model: any) => ({
        name: model.title,
        make: newMake._id,
      }));

      if (modelsToCreate.length > 0) {
        await VehicleModel.insertMany(modelsToCreate);
      }
    }

    logger.info('Data Imported Successfully!');
    process.exit(0);
  } catch (err: any) {
    logger.error(`Data Import Error: ${err.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Make.deleteMany();
    await VehicleModel.deleteMany();
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
