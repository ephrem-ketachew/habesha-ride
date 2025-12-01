import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import config from '../config/env.config.js';
import logger from '../config/logger.config.js';

import User from '../models/user.model.js';
import Car from '../models/car.model.js';
import Make from '../models/make.model.js';
import VehicleModel from '../models/vehicleModel.model.js';
import City from '../models/city.model.js';
import Feature from '../models/feature.model.js';
import RentalListing from '../models/rentalListing.model.js';
import SaleListing from '../models/saleListing.model.js';

const CONFIG = {
  USERS_TO_CREATE: 20,
  CARS_PER_USER: 3,
  LISTING_CHANCE: 0.8,
  RENTAL_SPLIT: 0.5,
};

const CAR_PHOTOS = [
  'https://images.unsplash.com/photo-1541443131876-44b03de101c5?q=80&w=800',
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800',
  'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=800',
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=800',
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=800',
  'https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=800',
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=800',
  'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?q=80&w=800',
  'https://images.unsplash.com/photo-1550355291-bbee04a92027?q=80&w=800',
  'https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=800',
  'https://images.unsplash.com/photo-1553440569-bcc63803a83d?q=80&w=800',
  'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=800',
  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800',
  'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?q=80&w=800',
  'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=800',
  'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=800',
  'https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd?q=80&w=800',
  'https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=800',
  'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=800',
  'https://images.unsplash.com/photo-1532974297617-c0f05fe48bff?q=80&w=800',
  'https://images.unsplash.com/photo-1489824904134-891ab64532f1?q=80&w=800',
  'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?q=80&w=800',
  'https://images.unsplash.com/photo-1485291571150-772bcfc10da5?q=80&w=800',
  'https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?q=80&w=800',
  'https://images.unsplash.com/photo-1469285994282-454ceb49e63c?q=80&w=800',
  'https://images.unsplash.com/photo-1554744512-d6c603f27c54?q=80&w=800',
  'https://images.unsplash.com/photo-1566008885218-90abf9200ddb?q=80&w=800',
  'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=800',
  'https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=800',
  'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?q=80&w=800',
  'https://images.unsplash.com/photo-1567818735868-e71b99932e29?q=80&w=800',
  'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?q=80&w=800',
  'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=800',
  'https://images.unsplash.com/photo-1559416523-140ddc3d238c?q=80&w=800',
  'https://images.unsplash.com/photo-1562911791-c7a97b729ec5?q=80&w=800',
  'https://images.unsplash.com/photo-1567374662583-b336a4065653?q=80&w=800',
  'https://images.unsplash.com/photo-1586084786421-3c17ba0108a9?q=80&w=800',
  'https://images.unsplash.com/photo-1648413653819-7c0fd93e8e6a?q=80&w=800',
  'https://images.unsplash.com/photo-1616455579100-2ceaa4eb2d37?q=80&w=800',
  'https://images.unsplash.com/photo-1591293835940-934a7c4f2d9b?q=80&w=800',
  'https://images.unsplash.com/photo-1494905998402-395d579af36f?q=80&w=800',
  'https://images.unsplash.com/photo-1546768292-fb12f6c92568?q=80&w=800',
  'https://images.unsplash.com/photo-1532988633349-d3dfb28ee834?q=80&w=800',
];

const connectDB = async () => {
  const dbUrl = config.mongo.uriTemplate.replace(
    '<PASSWORD>',
    config.mongo.password,
  );
  try {
    await mongoose.connect(dbUrl);
    logger.info('✅ Connected to MongoDB for seeding...');
  } catch (err: any) {
    logger.error('❌ DB Connection Error:', err);
    process.exit(1);
  }
};

const getRandomItem = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

const getRandomItems = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const generateUnavailableRanges = (count: number) => {
  const ranges = [];
  for (let i = 0; i < count; i++) {
    const startDate = faker.date.future();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + faker.number.int({ min: 1, max: 7 }));
    ranges.push({
      startDate,
      endDate,
      reason: getRandomItem(['booking', 'manual_block']),
    });
  }
  return ranges;
};

const cleanData = async () => {
  logger.warn('🧹 Cleaning up mock data (Users, Cars, Listings)...');
  await RentalListing.deleteMany({});
  await SaleListing.deleteMany({});
  await Car.deleteMany({});
  await User.deleteMany({ role: 'user' });
  logger.info('✨ Cleanup complete.');
};

const seed = async () => {
  const makes = await Make.find();
  const cities = await City.find();
  const features = await Feature.find();

  if (makes.length === 0 || cities.length === 0) {
    logger.error('❌ Master data missing! Run basic seeders first.');
    process.exit(1);
  }

  logger.info(
    `📚 Loaded ${makes.length} makes, ${cities.length} cities, ${features.length} features.`,
  );

  logger.info(`👤 Creating ${CONFIG.USERS_TO_CREATE} users...`);
  const users = [];
  for (let i = 0; i < CONFIG.USERS_TO_CREATE; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    users.push({
      firstName,
      lastName,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      phoneNumber: faker.string.numeric(10),
      password: 'Password123!',
      role: 'user',
      status: 'approved',
      isEmailVerified: true,
      isPhoneVerified: true,
      profileImage: faker.image.avatar(),
    });
  }
  const createdUsers = await User.insertMany(users);
  logger.info(`✅ Users created.`);

  logger.info(`🚗 Generating cars and listings...`);

  const rentalListings = [];
  const saleListings = [];

  for (const user of createdUsers) {
    const numCars = Math.floor(Math.random() * CONFIG.CARS_PER_USER) + 1;

    for (let j = 0; j < numCars; j++) {
      const make = getRandomItem(makes);
      const vehicleModels = await VehicleModel.find({ make: make._id });
      const model = getRandomItem(vehicleModels);
      const city = getRandomItem(cities);

      if (!model) continue;

      const carImages = getRandomItems(
        CAR_PHOTOS,
        Math.floor(Math.random() * 3) + 2,
      );
      const photoObjects = carImages.map((url, idx) => ({
        url,
        publicId: `mock_img_${faker.string.alphanumeric(8)}`,
        isPrimary: idx === 0,
      }));

      const car = await Car.create({
        owner: user._id,
        make: make._id,
        vehicleModel: model._id,
        year: faker.number.int({ min: 2010, max: 2024 }),
        licensePlate: faker.vehicle.vrm(),
        vin: faker.vehicle.vin(),
        bodyType: getRandomItem(['sedan', 'suv', 'truck', 'hatchback']),
        color: faker.vehicle.color(),
        genericColor: getRandomItem([
          'Black',
          'White',
          'Silver',
          'Blue',
          'Red',
          'Grey',
        ]),
        transmission: getRandomItem(['automatic', 'manual']),
        fuelType: getRandomItem(['gasoline', 'diesel', 'hybrid']),
        seatingCapacity: getRandomItem([4, 5, 7]),
        mileage: faker.number.int({ min: 0, max: 150000 }),
        condition: getRandomItem(['new', 'excellent', 'good', 'fair']),
        features: getRandomItems(features, 3).map((f) => f._id),
        homeLocation: {
          city: city._id,
          address: faker.location.streetAddress(),
        },
        verificationStatus: Math.random() > 0.1 ? 'approved' : 'pending',
        photos: photoObjects,
      });

      if (
        Math.random() < CONFIG.LISTING_CHANCE &&
        car.verificationStatus === 'approved'
      ) {
        const isRent = Math.random() < CONFIG.RENTAL_SPLIT;

        if (isRent) {
          const deliveryAvailable = faker.datatype.boolean();
          const isMileageLimited = faker.datatype.boolean();
          const weeklyDiscount = faker.number.int({ min: 0, max: 15 });
          const monthlyDiscount = faker.number.int({
            min: weeklyDiscount,
            max: 30,
          });
          const numUnavailableRanges = faker.number.int({ min: 0, max: 2 });

          rentalListings.push({
            car: car._id,
            owner: user._id,
            status: 'listed',
            ratePerDay: faker.number.int({ min: 1000, max: 15000 }),
            ratePerHour: faker.datatype.boolean()
              ? faker.number.int({ min: 100, max: 500 })
              : undefined,
            securityDeposit: faker.number.int({ min: 5000, max: 20000 }),
            weeklyDiscountPercent: weeklyDiscount,
            monthlyDiscountPercent: monthlyDiscount,
            allowedMileagePerDay: isMileageLimited
              ? faker.number.int({ min: 100, max: 500 })
              : null,
            excessMileageFee: isMileageLimited
              ? faker.number.int({ min: 20, max: 100 })
              : 0,
            advanceNoticeHours: faker.number.int({ min: 6, max: 48 }),
            deliveryAvailable,
            deliveryFee: deliveryAvailable
              ? faker.number.int({ min: 100, max: 500 })
              : undefined,
            minRentalDurationDays: faker.number.int({ min: 1, max: 3 }),
            maxRentalDurationDays: faker.number.int({ min: 30, max: 90 }),
            instantBookingAvailable: faker.datatype.boolean(),
            cancellationPolicy: getRandomItem([
              'flexible',
              'moderate',
              'strict',
            ]),
            listingDescription: faker.lorem.paragraph(),
            unavailableRanges: generateUnavailableRanges(numUnavailableRanges),
            isFeatured: Math.random() < 0.1,
          });
        } else {
          saleListings.push({
            car: car._id,
            owner: user._id,
            status: 'available',
            salePrice: faker.number.int({ min: 500000, max: 5000000 }),
            listingDescription: faker.lorem.paragraph(),
            isFeatured: Math.random() < 0.1,
          });
        }
      }
    }
  }

  if (rentalListings.length > 0) await RentalListing.insertMany(rentalListings);
  if (saleListings.length > 0) await SaleListing.insertMany(saleListings);

  logger.info(`🎉 Mock Data Injection Complete!`);
  logger.info(`   - Users: ${CONFIG.USERS_TO_CREATE}`);
  logger.info(
    `   - Cars: ${rentalListings.length + saleListings.length} (approx)`,
  );
  logger.info(`   - Rentals: ${rentalListings.length}`);
  logger.info(`   - Sales: ${saleListings.length}`);

  process.exit(0);
};

const run = async () => {
  await connectDB();
  if (process.argv[2] === '-d') {
    await cleanData();
    process.exit(0);
  }
  await seed();
};

run();
