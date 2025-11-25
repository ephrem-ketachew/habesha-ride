import SaleListing from '../models/saleListing.model.js';
import Car from '../models/car.model.js';
import AppError from '../utils/appError.util.js';
import {
  CreateSaleListingInput,
  UpdateSaleListingInput,
  GetSaleListingsQuery,
} from '../validation/sale.validation.js';


export const createSaleListing = async (
  userId: string,
  input: CreateSaleListingInput,
) => {
  const car = await Car.findById(input.car);

  if (!car) {
    throw new AppError('Car not found.', 404);
  }

  if (car.owner!.toString() !== userId) {
    throw new AppError('You can only list cars that you own.', 403);
  }

  if (car.verificationStatus !== 'approved') {
    throw new AppError(
      `Cannot list this car. Status is '${car.verificationStatus}'. It must be 'approved' by an admin first.`,
      400,
    );
  }

  const existingListing = await SaleListing.findOne({ car: input.car });
  if (existingListing) {
    throw new AppError(
      'This car already has a sale listing. Please update the existing one.',
      409,
    );
  }

  const listing = await SaleListing.create({
    ...input,
    owner: userId,
    status: 'available',
  });

  return listing;
};


export const getMySaleListings = async (userId: string) => {
  const listings = await SaleListing.find({ owner: userId })
    .populate({
      path: 'car',
      populate: ['make', 'vehicleModel'],
    })
    .sort({ createdAt: -1 });

  return listings;
};


export const getPublicSaleListings = async (query: GetSaleListingsQuery) => {
  const { minPrice, maxPrice, page, limit, city } = query;

  const filter: any = {
    status: 'available',
  };

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.salePrice = {};
    if (minPrice) filter.salePrice.$gte = minPrice;
    if (maxPrice) filter.salePrice.$lte = maxPrice;
  }

  const skip = (page - 1) * limit;

  const listings = await SaleListing.find(filter)
    .populate({
      path: 'car',
      populate: ['make', 'vehicleModel'],
    })
    .populate('owner', 'firstName lastName profileImage')
    .skip(skip)
    .limit(limit)
    .sort({ isFeatured: -1, createdAt: -1 });

  const total = await SaleListing.countDocuments(filter);

  return {
    listings,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalResults: total,
  };
};


export const getSaleListingById = async (
  id: string,
  viewerId?: string,
) => {
  const listing = await SaleListing.findById(id)
    .populate({
      path: 'car',
      populate: ['make', 'vehicleModel'],
    })
    .populate('owner', 'firstName lastName profileImage createdAt');

  if (!listing) {
    throw new AppError('Listing not found.', 404);
  }

  if (listing.status !== 'available') {
    const owner = listing.owner as any;
    const isOwner = viewerId && owner._id.toString() === viewerId;

    if (!isOwner) {
      throw new AppError('Listing not found or unavailable.', 404);
    }
  }

  return listing;
};


export const updateSaleListing = async (
  userId: string,
  listingId: string,
  input: UpdateSaleListingInput,
) => {
  const listing = await SaleListing.findById(listingId);

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


export const deleteSaleListing = async (
  userId: string,
  listingId: string,
) => {
  const listing = await SaleListing.findById(listingId);

  if (!listing) {
    throw new AppError('Listing not found.', 404);
  }

  if (listing.owner!.toString() !== userId) {
    throw new AppError('You are not authorized to delete this listing.', 403);
  }

  await listing.deleteOne();
};
