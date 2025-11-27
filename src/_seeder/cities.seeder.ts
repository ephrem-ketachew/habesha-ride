import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/env.config.js';
import City from '../models/city.model.js';
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

let citiesData: any = {};
try {
  const jsonPath = path.resolve(__dirname, '../_data/cities.json');
  citiesData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
} catch (err) {
  logger.error(`Failed to read _data/cities.json: ${err}`);
  process.exit(1);
}

const rawCities = citiesData.basic_woreda_towns || [];
logger.info(`Loaded ${rawCities.length} cities from cities.json`);

const importData = async () => {
  try {
    await City.deleteMany();
    logger.info('Old data destroyed...');

    const citiesToInsert: Array<{
      name: string;
      region: string;
      isActive: boolean;
    }> = [];
    const seenNames = new Set<string>();

    for (const item of rawCities) {
      const cityName = item.name?.trim();
      const regionName = item.subcity_zone?.region_city?.name?.trim();

      if (!cityName || !regionName) {
        continue;
      }

      if (seenNames.has(cityName)) {
        continue;
      }

      seenNames.add(cityName);
      citiesToInsert.push({
        name: cityName,
        region: regionName,
        isActive: true,
      });
    }

    if (citiesToInsert.length > 0) {
      await City.insertMany(citiesToInsert);
    }

    logger.info(
      `Data Imported Successfully! ${citiesToInsert.length} unique cities added.`,
    );
    process.exit(0);
  } catch (err: any) {
    logger.error(`Data Import Error: ${err.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await City.deleteMany();
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
