import RentalListing from '../models/rentalListing.model.js';
import Car from '../models/car.model.js';
import AppError from '../utils/appError.util.js';
import {
  CreateRentalListingInput,
  UpdateRentalListingInput,
  GetRentalListingsQuery,
} from '../validation/rental.validation.js';
import { ca } from 'zod/locales';

export const createRentalListing = async (
  userId: string,
  input: CreateRentalListingInput,
) => {
  const car = await Car.findById(input.car);

  if (!car) {
    throw new AppError('Car not found.', 404);
  }

  console.log(
    'Car owner id is ',
    car.owner,
    userId,
    ' and User id is ',
    userId,
    ' are they  equal? ',
    car.owner!.toString() === userId,
  );

  if (car.owner!.toString() !== userId) {
    throw new AppError('You can only list cars that you own.', 403);
  }

  if (car.verificationStatus !== 'approved') {
    throw new AppError(
      `Cannot list this car. Status is '${car.verificationStatus}'. It must be 'approved' by an admin first.`,
      400,
    );
  }

  const existingListing = await RentalListing.findOne({ car: input.car });
  if (existingListing) {
    throw new AppError(
      'This car already has a rental listing. Please update the existing one.',
      409,
    );
  }

  const listing = await RentalListing.create({
    ...input,
    owner: userId,
    status: 'listed',
  });

  return listing;
};

export const getMyRentalListings = async (userId: string) => {
  const listings = await RentalListing.find({ owner: userId })
    .populate({
      path: 'car',
      populate: ['make', 'vehicleModel'],
    })
    .sort({ createdAt: -1 });
  return listings;
};

export const getPublicRentalListings = async (
  query: GetRentalListingsQuery,
) => {
  const { minPrice, maxPrice, page, limit, city } = query;

  const filter: any = {
    status: 'listed',
  };

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.ratePerDay = {};
    if (minPrice) filter.ratePerDay.$gte = minPrice;
    if (maxPrice) filter.ratePerDay.$lte = maxPrice;
  }

  const skip = (page - 1) * limit;

  const listings = await RentalListing.find(filter)
    .populate({
      path: 'car',
      populate: ['make', 'vehicleModel'],
    })
    .populate('owner', 'firstName lastName profileImage')
    .skip(skip)
    .limit(limit)
    .sort({ isFeatured: -1, createdAt: -1 });

  const total = await RentalListing.countDocuments(filter);

  return {
    listings,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalResults: total,
  };
};

export const getRentalListingById = async (id: string, viewerId?: string) => {
  const listing = await RentalListing.findById(id)
    .populate({
      path: 'car',
      populate: ['make', 'vehicleModel'],
    })
    .populate('owner', 'firstName lastName profileImage createdAt');

  if (!listing) {
    throw new AppError('Listing not found.', 404);
  }

  if (listing.status !== 'listed') {
    const owner = listing.owner as any;

    const isOwner = viewerId && owner._id.toString() === viewerId;

    if (!isOwner) {
      throw new AppError('Listing not found or unavailable.', 404);
    }
  }

  return listing;
};

export const updateRentalListing = async (
  userId: string,
  listingId: string,
  input: UpdateRentalListingInput,
) => {
  const listing = await RentalListing.findById(listingId);

  if (!listing) {
    throw new AppError('Listing not found.', 404);
  }

  if (listing.owner!.toString() !== userId) {
    throw new AppError('You are not authorized to edit this listing.', 403);
  }

  Object.assign(listing, input);
  await listing.save();

  return listing;
};

export const deleteRentalListing = async (
  userId: string,
  listingId: string,
) => {
  const listing = await RentalListing.findById(listingId);

  if (!listing) {
    throw new AppError('Listing not found.', 404);
  }

  if (listing.owner!.toString() !== userId) {
    throw new AppError('You are not authorized to delete this listing.', 403);
  }

  await listing.deleteOne();
};
