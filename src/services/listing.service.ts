import RentalListing from '../models/rentalListing.model.js';

export const getUnifiedListings = async (query: any) => {
  const { page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;

  const pipeline: any[] = [
    { $match: { status: 'listed' } },
    {
      $addFields: {
        listingType: 'rent',
        displayPrice: '$ratePerDay',
        period: '/day',
      },
    },
    {
      $unionWith: {
        coll: 'salelistings',
        pipeline: [
          { $match: { status: 'available' } },
          {
            $addFields: {
              listingType: 'sale',
              displayPrice: '$salePrice',
              period: '',
            },
          },
        ],
      },
    },

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

    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'ownerData',
      },
    },
    { $unwind: '$ownerData' },

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

    {
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $sort: { isFeatured: -1, createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              listingType: 1,
              displayPrice: 1,
              period: 1,
              isFeatured: 1,
              createdAt: 1,
              car: '$carData',
              owner: {
                firstName: '$ownerData.firstName',
                lastName: '$ownerData.lastName',
                profileImage: '$ownerData.profileImage',
              },
            },
          },
        ],
      },
    },
  ];

  const result = await RentalListing.aggregate(pipeline);
  const data = result[0].data;
  const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;

  return {
    listings: data,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalResults: total,
  };
};
