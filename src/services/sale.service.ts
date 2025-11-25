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

  const pageNum = page ? Number(page) : 1;
  const limitNum = limit ? Number(limit) : 20;
  const skip = (pageNum - 1) * limitNum;

  const matchStage: any = {
    status: 'available',
  };

  if (minPrice !== undefined || maxPrice !== undefined) {
    matchStage.salePrice = {};
    if (minPrice !== undefined) matchStage.salePrice.$gte = minPrice;
    if (maxPrice !== undefined) matchStage.salePrice.$lte = maxPrice;
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
            salePrice: 1,
            condition: 1,
            status: 1,
            isFeatured: 1,
            listingDescription: 1,
            createdAt: 1,
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
              mileage: '$carData.mileage',
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

  const result = await SaleListing.aggregate(pipeline);
  const data = result[0].data;
  const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;

  return {
    listings: data,
    currentPage: pageNum,
    totalPages: Math.ceil(total / limitNum),
    totalResults: total,
  };
};

export const getSaleListingById = async (id: string, viewerId?: string) => {
  const listing = await SaleListing.findById(id)
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

  const isAvailable = listing.status === 'available';
  const isCarApproved = car.verificationStatus === 'approved';

  const isOwner = viewerId && owner._id.toString() === viewerId;

  if (!(isAvailable && isCarApproved)) {
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

export const deleteSaleListing = async (userId: string, listingId: string) => {
  const listing = await SaleListing.findById(listingId);

  if (!listing) {
    throw new AppError('Listing not found.', 404);
  }

  if (listing.owner!.toString() !== userId) {
    throw new AppError('You are not authorized to delete this listing.', 403);
  }

  await listing.deleteOne();
};
