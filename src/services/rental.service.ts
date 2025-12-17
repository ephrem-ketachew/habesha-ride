import mongoose from 'mongoose';
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

export const getPublicRentalListings = async (
  query: GetRentalListingsQuery,
) => {
  const {
    minPrice,
    maxPrice,
    page,
    limit,
    city,
    make,
    bodyType,
    transmission,
    fuelType,
    genericColor,
    condition,
    minSeats,
    minYear,
    maxYear,
    deliveryAvailable,
    features,
    search,
    isFeatured,
    pickupDate,
    returnDate,
  } = query;

  const pageNum = page ? Number(page) : 1;
  const limitNum = limit ? Number(limit) : 20;

  const skip = (pageNum - 1) * limitNum;

  const matchStage: any = {
    status: 'listed',
  };

  if (deliveryAvailable !== undefined) {
    matchStage.deliveryAvailable = deliveryAvailable;
  }

  if (isFeatured !== undefined) {
    matchStage.isFeatured = isFeatured;
  }

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
      matchStage.ratePerDay = priceFilter;
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

  if (bodyType) {
    carMatchStage['carData.bodyType'] = bodyType;
  }

  if (transmission) {
    carMatchStage['carData.transmission'] = transmission;
  }

  if (fuelType) {
    carMatchStage['carData.fuelType'] = fuelType;
  }

  if (genericColor) {
    carMatchStage['carData.genericColor'] = genericColor;
  }

  if (condition) {
    carMatchStage['carData.condition'] = condition;
  }

  if (minSeats !== undefined) {
    const minSeatsNum = Number(minSeats);
    if (!isNaN(minSeatsNum)) {
      carMatchStage['carData.seatingCapacity'] = {
        $gte: minSeatsNum,
      };
    }
  }

  if (minYear !== undefined || maxYear !== undefined) {
    carMatchStage['carData.year'] = {};
    if (minYear !== undefined) {
      const minYearNum = Number(minYear);
      if (!isNaN(minYearNum)) {
        carMatchStage['carData.year'].$gte = minYearNum;
      }
    }
    if (maxYear !== undefined) {
      const maxYearNum = Number(maxYear);
      if (!isNaN(maxYearNum)) {
        carMatchStage['carData.year'].$lte = maxYearNum;
      }
    }
  }

  if (features && features.length > 0) {
    const featureIds = (Array.isArray(features) ? features : [features]).map(
      (id) => new mongoose.Types.ObjectId(id),
    );
    carMatchStage['carData.features'] = { $all: featureIds };
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

  // If date range is provided, filter by availability
  if (pickupDate && returnDate) {
    // Convert dates to ensure they're Date objects
    const pickupDateObj = new Date(pickupDate);
    const returnDateObj = new Date(returnDate);

    // Lookup bookings to check for conflicts
    pipeline.push({
      $lookup: {
        from: 'bookings',
        let: {
          listingId: '$_id',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$listing', '$$listingId'] },
                  {
                    $in: ['$status', ['pending', 'confirmed', 'active']],
                  },
                ],
              },
              startDate: { $lt: returnDateObj },
              endDate: { $gt: pickupDateObj },
            },
          },
        ],
        as: 'conflictingBookings',
      },
    });

    // Filter out listings with conflicting bookings
    pipeline.push({
      $match: {
        conflictingBookings: { $size: 0 },
      },
    });

    // Filter out listings with unavailable ranges that overlap
    // We'll use $addFields to check unavailable ranges
    pipeline.push({
      $addFields: {
        hasOverlappingUnavailableRange: {
          $anyElementTrue: {
            $map: {
              input: '$unavailableRanges',
              as: 'range',
              in: {
                $and: [
                  {
                    $lt: [pickupDateObj, '$$range.endDate'],
                  },
                  {
                    $gt: [returnDateObj, '$$range.startDate'],
                  },
                ],
              },
            },
          },
        },
      },
    });

    pipeline.push({
      $match: {
        hasOverlappingUnavailableRange: false,
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
            ratePerDay: 1,
            ratePerHour: 1,
            securityDeposit: 1,
            weeklyDiscountPercent: 1,
            monthlyDiscountPercent: 1,
            allowedMileagePerDay: 1,
            excessMileageFee: 1,
            advanceNoticeHours: 1,
            status: 1,
            isFeatured: 1,
            deliveryAvailable: 1,
            deliveryFee: 1,
            minRentalDurationDays: 1,
            maxRentalDurationDays: 1,
            instantBookingAvailable: 1,
            cancellationPolicy: 1,
            unavailableRanges: 1,
            hasOverlappingUnavailableRange: 0,
            conflictingBookings: 0,
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
              condition: '$carData.condition',
              genericColor: '$carData.genericColor',
              color: '$carData.color',
              accidentHistory: '$carData.accidentHistory',
              mileage: '$carData.mileage',
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
        { path: 'homeLocation.city', select: 'name region' },
        { path: 'features', select: 'name' },
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
