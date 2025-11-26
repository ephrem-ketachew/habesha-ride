import RentalListing from '../models/rentalListing.model.js';
import Car from '../models/car.model.js';
import AppError from '../utils/appError.util.js';
import {
  CreateRentalListingInput,
  UpdateRentalListingInput,
  GetRentalListingsQuery,
} from '../validation/rental.validation.js';
import { GetListingsAdminQuery } from '../validation/admin.validation.js';

export const createRentalListing = async (
  userId: string,
  input: CreateRentalListingInput,
) => {
  const car = await Car.findById(input.car);

  if (!car) {
    throw new AppError('Car not found.', 404);
  }

  if (car.owner!.toString() !== userId) {
    throw new AppError('You can only list cars that you own.', 403);
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

  const pageNum = page ? Number(page) : 1;
  const limitNum = limit ? Number(limit) : 20;

  const skip = (pageNum - 1) * limitNum;

  const matchStage: any = {
    status: 'listed',
  };

  if (minPrice !== undefined || maxPrice !== undefined) {
    matchStage.ratePerDay = {};
    if (minPrice !== undefined) matchStage.ratePerDay.$gte = minPrice;
    if (maxPrice !== undefined) matchStage.ratePerDay.$lte = maxPrice;
  }

  const pipeline: any[] = [
    { $match: matchStage },

    {
      $lookup: {
        from: 'cars',
        localField: 'car',
        foreignField: '_id',
        as: 'carData',
      },
    },
    { $unwind: '$carData' },

    {
      $match: {
        'carData.verificationStatus': 'approved',
      },
    },
  ];

  if (city) {
    pipeline.push({
      $match: {
        'carData.homeLocation.city': { $regex: city, $options: 'i' },
      },
    });
  }

  pipeline.push(
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'ownerData',
      },
    },
    { $unwind: '$ownerData' },
  );

  pipeline.push(
    {
      $lookup: {
        from: 'makes',
        localField: 'carData.make',
        foreignField: '_id',
        as: 'carData.make',
      },
    },
    { $unwind: '$carData.make' },
    {
      $lookup: {
        from: 'vehiclemodels',
        localField: 'carData.vehicleModel',
        foreignField: '_id',
        as: 'carData.vehicleModel',
      },
    },
    { $unwind: '$carData.vehicleModel' },
  );

  pipeline.push({
    $facet: {
      metadata: [{ $count: 'total' }],
      data: [
        { $sort: { isFeatured: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limitNum },
        {
          $project: {
            _id: 1,
            ratePerDay: 1,
            status: 1,
            isFeatured: 1,
            deliveryAvailable: 1,
            car: {
              _id: '$carData._id',
              make: '$carData.make',
              vehicleModel: '$carData.vehicleModel',
              year: '$carData.year',
              type: '$carData.bodyType',
              transmission: '$carData.transmission',
              fuelType: '$carData.fuelType',
              seats: '$carData.seatingCapacity',
              photos: '$carData.photos',
              location: '$carData.homeLocation',
            },
            owner: {
              firstName: '$ownerData.firstName',
              lastName: '$ownerData.lastName',
              profileImage: '$ownerData.profileImage',
            },
          },
        },
      ],
    },
  });

  const result = await RentalListing.aggregate(pipeline);

  const data = result[0].data;
  const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;

  return {
    listings: data,
    currentPage: pageNum,
    totalPages: Math.ceil(total / limitNum),
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

  const car = listing.car as any;
  const owner = listing.owner as any;

  const isListed = listing.status === 'listed';

  const isCarApproved = car.verificationStatus === 'approved';

  const isOwner = viewerId && owner._id.toString() === viewerId;

  if (!(isListed && isCarApproved)) {
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

export const getAllRentalListingsAdmin = async (
  query: GetListingsAdminQuery,
) => {
  const { page, limit, status } = query;
  const filter: any = {};

  if (status) filter.status = status;

  const listings = await RentalListing.find(filter)
    .populate({ path: 'car', populate: ['make', 'vehicleModel'] })
    .populate('owner', 'firstName lastName email phoneNumber')
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await RentalListing.countDocuments(filter);

  return { listings, total, page, totalPages: Math.ceil(total / limit) };
};

export const updateRentalListingStatus = async (id: string, status: string) => {
  const listing = await RentalListing.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true },
  );
  if (!listing) throw new AppError('Rental listing not found', 404);
  return listing;
};

export const getRentalListingByIdAdmin = async (id: string) => {
  const listing = await RentalListing.findById(id)
    .populate({
      path: 'car',
      populate: [
        { path: 'make', select: 'name' },
        { path: 'vehicleModel', select: 'name' },
      ],
    })
    .populate(
      'owner',
      'firstName lastName email phoneNumber profileImage status',
    );

  if (!listing) {
    throw new AppError('Rental listing not found.', 404);
  }
  return listing;
};
