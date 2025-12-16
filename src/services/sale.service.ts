import SaleListing from '../models/saleListing.model.js';
import Car from '../models/car.model.js';
import AppError from '../utils/appError.util.js';
import {
  CreateSaleListingInput,
  UpdateSaleListingInput,
  GetSaleListingsQuery,
} from '../validation/sale.validation.js';
import { GetListingsAdminQuery } from '../validation/admin.validation.js';
import mongoose from 'mongoose';

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
      populate: [
        { path: 'make' },
        { path: 'vehicleModel' },
        { path: 'homeLocation.city' },
        { path: 'features' },
      ],
    })
    .sort({ createdAt: -1 });

  return listings;
};

export const getPublicSaleListings = async (query: GetSaleListingsQuery) => {
  const { minPrice, maxPrice, page, limit, city, make, transmission, search } =
    query;

  const pageNum = page ? Number(page) : 1;
  const limitNum = limit ? Number(limit) : 20;
  const skip = (pageNum - 1) * limitNum;

  const matchStage: any = {
    status: 'available',
  };

  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceFilter: any = {};
    if (
      minPrice !== undefined &&
      minPrice !== null &&
      !isNaN(Number(minPrice))
    ) {
      priceFilter.$gte = Number(minPrice);
    }
    if (
      maxPrice !== undefined &&
      maxPrice !== null &&
      !isNaN(Number(maxPrice))
    ) {
      priceFilter.$lte = Number(maxPrice);
    }
    if (Object.keys(priceFilter).length > 0) {
      matchStage.salePrice = priceFilter;
    }
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
  ];

  const carMatchStage: any = {
    'carData.verificationStatus': 'approved',
  };

  if (make) {
    carMatchStage['carData.make'] = new mongoose.Types.ObjectId(make);
  }

  if (transmission) {
    carMatchStage['carData.transmission'] = transmission;
  }

  pipeline.push({ $match: carMatchStage });

  pipeline.push(
    {
      $lookup: {
        from: 'cities',
        localField: 'carData.homeLocation.city',
        foreignField: '_id',
        as: 'cityData',
      },
    },
    { $unwind: '$cityData' },
  );

  if (city) {
    pipeline.push({
      $match: {
        'cityData.name': { $regex: city, $options: 'i' },
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

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    pipeline.push({
      $match: {
        $or: [
          { 'carData.make.name': searchRegex },
          { 'carData.vehicleModel.name': searchRegex },
          { 'cityData.name': searchRegex },
        ],
      },
    });
  }

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
              condition: '$carData.condition',
              accidentHistory: '$carData.accidentHistory',
              location: {
                address: '$carData.homeLocation.address',
                city: '$cityData',
              },
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
      populate: [
        { path: 'make' },
        { path: 'vehicleModel' },
        { path: 'homeLocation.city' },
        { path: 'features' },
      ],
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

export const getAllSaleListingsAdmin = async (query: GetListingsAdminQuery) => {
  const { page, limit, status } = query;
  const filter: any = {};

  if (status) filter.status = status;

  const listings = await SaleListing.find(filter)
    .populate({
      path: 'car',
      populate: [
        { path: 'make' },
        { path: 'vehicleModel' },
        { path: 'homeLocation.city' },
        { path: 'features' },
      ],
    })
    .populate('owner', 'firstName lastName email phoneNumber')
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await SaleListing.countDocuments(filter);

  return { listings, total, page, totalPages: Math.ceil(total / limit) };
};

export const updateSaleListingStatus = async (id: string, status: string) => {
  const listing = await SaleListing.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true },
  );
  if (!listing) throw new AppError('Sale listing not found', 404);
  return listing;
};

export const getSaleListingByIdAdmin = async (id: string) => {
  const listing = await SaleListing.findById(id)
    .populate({
      path: 'car',
      populate: [
        { path: 'make', select: 'name' },
        { path: 'vehicleModel', select: 'name' },
        { path: 'homeLocation.city', select: 'name region' },
        { path: 'features', select: 'name' },
      ],
    })
    .populate(
      'owner',
      'firstName lastName email phoneNumber profileImage status',
    );

  if (!listing) {
    throw new AppError('Sale listing not found.', 404);
  }
  return listing;
};
