import Car from '../models/car.model.js';
import { CreateCarInput } from '../validation/car.validation.js';
import { UpdateCarInput } from '../validation/car.validation.js';
import { deleteCloudinaryResources } from '../utils/cloudinary.util.js';
import { ICarPhoto } from '../types/car.types.js';
import AppError from '../utils/appError.util.js';

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

  const publicIdsToDelete = input.photosToDelete || [];
  if (publicIdsToDelete.length > 0) {
    await deleteCloudinaryResources(publicIdsToDelete);
    car.photos = car.photos.filter(
      (photo) => !publicIdsToDelete.includes(photo.publicId),
    );
  }

  if (newFiles && newFiles.length > 0) {
    const newPhotos: ICarPhoto[] = newFiles.map((file) => ({
      url: file.path,
      publicId: file.filename,
      isPrimary: false,
    }));
    car.photos.push(...newPhotos);
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
