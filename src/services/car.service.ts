import Car from '../models/car.model.js';
import { CreateCarInput } from '../validation/car.validation.js';
import { UpdateCarInput } from '../validation/car.validation.js';
import { deleteCloudinaryResources } from '../utils/cloudinary.util.js';
import { ICarPhoto } from '../types/car.types.js';
import AppError from '../utils/appError.util.js';
import { GetCarsAdminQuery } from '../validation/admin.validation.js';
import { CarVerificationStatus } from '../types/car.types.js';
import { sendEmail } from '../utils/email.util.js';
import { IUserDocument } from '../types/user.types.js';
import logger from '../config/logger.config.js';
import config from '../config/env.config.js';

export const createCar = async (
  input: CreateCarInput,
  files: Express.Multer.File[],
  ownerId: string,
) => {
  const photos: ICarPhoto[] = files.map((file, index) => ({
    url: file.path,
    publicId: file.filename,
    isPrimary: index === 0,
  }));

  const carData = {
    ...input,
    photos,
    owner: ownerId,
    verificationStatus: 'pending',
  };

  const car = await Car.create(carData);
  return car;
};

export const getMyCars = async (ownerId: string) => {
  const cars = await Car.find({ owner: ownerId })
    .populate('make')
    .populate('vehicleModel')
    .sort({ createdAt: -1 });
  return cars;
};

export const getCarById = async (carId: string, ownerId: string) => {
  const car = await Car.findById(carId)
    .populate('make')
    .populate('vehicleModel');

  if (!car) {
    throw new AppError('No car found with that ID.', 404);
  }

  if (car.owner?.toString() !== ownerId) {
    throw new AppError('You are not authorized to view this car.', 403);
  }

  return car;
};

export const updateCar = async (
  carId: string,
  ownerId: string,
  input: UpdateCarInput,
  newFiles: Express.Multer.File[],
) => {
  const car = await Car.findById(carId);
  if (!car) {
    throw new AppError('No car found with that ID.', 404);
  }
  if (car.owner!.toString() !== ownerId) {
    throw new AppError('You are not authorized to edit this car.', 403);
  }

  let photosChanged = false;

  const publicIdsToDelete = input.photosToDelete || [];
  if (publicIdsToDelete.length > 0) {
    await deleteCloudinaryResources(publicIdsToDelete);

    const originalPhotoCount = car.photos.length;

    car.photos = car.photos.filter(
      (photo) => !publicIdsToDelete.includes(photo.publicId),
    );

    if (car.photos.length !== originalPhotoCount) {
      photosChanged = true;
    }
  }

  if (newFiles && newFiles.length > 0) {
    const newPhotos: ICarPhoto[] = newFiles.map((file) => ({
      url: file.path,
      publicId: file.filename,
      isPrimary: false,
    }));
    car.photos.push(...newPhotos);

    photosChanged = true;
  }

  if (input.primaryPhoto) {
    let primarySet = false;
    car.photos.forEach((photo) => {
      if (photo.publicId === input.primaryPhoto) {
        photo.isPrimary = true;
        primarySet = true;
      } else {
        photo.isPrimary = false;
      }
    });

    if (!primarySet) {
      throw new AppError(
        'Primary photo not found. It must be an existing photo or one you are currently uploading.',
        400,
      );
    }
  }

  const { photosToDelete, primaryPhoto, homeLocation, ...updateData } = input;

  Object.assign(car, updateData);

  if (homeLocation) {
    Object.assign(car.homeLocation, homeLocation);
  }

  if (car.verificationStatus === 'rejected') {
    car.verificationStatus = 'pending';
  } else if (car.verificationStatus === 'approved') {
    const criticalFieldsChanged =
      photosChanged ||
      car.isModified('make') ||
      car.isModified('vehicleModel') ||
      car.isModified('year') ||
      car.isModified('vin') ||
      car.isModified('licensePlate');

    if (criticalFieldsChanged) {
      car.verificationStatus = 'pending';
    }
  }

  await car.save();
  return car;
};

export const deleteCar = async (carId: string, ownerId: string) => {
  const car = await Car.findById(carId);
  if (!car) {
    throw new AppError('No car found with that ID.', 404);
  }
  if (car.owner!.toString() !== ownerId) {
    throw new AppError('You are not authorized to delete this car.', 403);
  }

  // const futureBookings = await Booking.find({
  //   car: car._id,
  //   status: 'confirmed',
  //   endDate: { $gt: new Date() },
  // });

  // if (futureBookings.length > 0) {
  //   throw new AppError(
  //     'You cannot delete this car. It has active or future bookings. Please cancel them first.',
  //     400,
  //   );
  // }

  const publicIdsToDelete = car.photos.map((photo) => photo.publicId);
  if (publicIdsToDelete.length > 0) {
    await deleteCloudinaryResources(publicIdsToDelete);
  }

  // await Promise.all([
  //   RentalListing.deleteOne({ car: car._id }),
  //   SaleListing.deleteOne({ car: car._id }),
  //   Booking.deleteMany({ car: car._id }),
  // ]);

  await car.deleteOne();
};

export const getAllCarsAdmin = async (query: GetCarsAdminQuery) => {
  const { status, page, limit } = query;

  const filter: { verificationStatus?: CarVerificationStatus } = {};
  if (status) {
    filter.verificationStatus = status;
  }

  const skip = (page - 1) * limit;

  const cars = await Car.find(filter)
    .populate('owner', 'fullName email')
    .populate('make', 'name')
    .populate('vehicleModel', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalCars = await Car.countDocuments(filter);

  return {
    cars,
    totalPages: Math.ceil(totalCars / limit),
    currentPage: page,
    totalCars,
  };
};

export const updateCarVerificationStatus = async (
  carId: string,
  status: CarVerificationStatus,
) => {
  const car = await Car.findByIdAndUpdate(
    carId,
    { verificationStatus: status },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!car) {
    throw new AppError('No car found with that ID.', 404);
  }

  await car.populate('owner', 'email fullName');
  const owner = car.owner as unknown as IUserDocument;

  try {
    const carName = `${car.year} ${car.make} ${car.vehicleModel}`;

    if (status === 'approved') {
      await sendEmail({
        to: owner.email,
        subject: '🎉 Your Car is Approved on Kech.ai!',
        text: `Hello ${owner.fullName},\n\nGreat news! Your ${carName} has been approved by our team. It is now eligible to be listed for rent or sale.\n\nLog in to create your listings now!`,
        html: `
          <h3>Great news, ${owner.fullName}!</h3>
          <p>Your <strong>${carName}</strong> has been verified and approved by our team.</p>
          <p>It is now eligible to be listed for rent or sale.</p>
          <a href="${config.clientUrl}/dashboard/my-cars" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Manage My Car</a>
        `,
      });
    } else if (status === 'rejected') {
      await sendEmail({
        to: owner.email,
        subject: 'Action Required: Your Car Verification',
        text: `Hello ${owner.fullName},\n\nUnfortunately, your ${carName} could not be approved at this time. Please check your dashboard for details or contact support.`,
        html: `
          <h3>Hello ${owner.fullName},</h3>
          <p>Unfortunately, your <strong>${carName}</strong> could not be approved at this time.</p>
          <p>Please check your dashboard to ensure your photos are clear and details are accurate.</p>
          <a href="${config.clientUrl}/dashboard/my-cars">Go to Dashboard</a>
        `,
      });
    }

    logger.info(
      `[Email]: Verification email sent to ${owner.email} for car ${car._id}`,
    );
  } catch (emailError) {
    logger.error(
      emailError,
      `[Email]: Failed to send car verification email for ${car._id}`,
    );
  }

  return car;
};
