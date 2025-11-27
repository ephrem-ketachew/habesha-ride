import Feature from '../models/feature.model.js';
import Car from '../models/car.model.js';
import AppError from '../utils/appError.util.js';
import {
  GetFeaturesQuery,
  CreateFeatureInput,
  UpdateFeatureInput,
} from '../validation/feature.validation.js';

export const getFeatures = async (query: GetFeaturesQuery) => {
  const { search, page, limit } = query;

  const filter: any = { isActive: true };

  if (search) {
    filter.name = { $regex: new RegExp(search, 'i') };
  }

  const skip = (page - 1) * limit;

  const features = await Feature.find(filter)
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  const total = await Feature.countDocuments(filter);

  return {
    features,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalResults: total,
  };
};

export const getFeatureById = async (id: string) => {
  const feature = await Feature.findById(id);

  if (!feature) {
    throw new AppError('Feature not found.', 404);
  }

  return feature;
};

export const createFeature = async (input: CreateFeatureInput) => {
  const existing = await Feature.findOne({
    name: { $regex: new RegExp(`^${input.name}$`, 'i') },
  });

  if (existing) {
    throw new AppError(`Feature '${input.name}' already exists.`, 409);
  }

  const feature = await Feature.create(input);
  return feature;
};

export const updateFeature = async (id: string, input: UpdateFeatureInput) => {
  if (input.name) {
    const existing = await Feature.findOne({
      name: { $regex: new RegExp(`^${input.name}$`, 'i') },
      _id: { $ne: id },
    });

    if (existing) {
      throw new AppError(`Feature '${input.name}' already exists.`, 409);
    }
  }

  const feature = await Feature.findByIdAndUpdate(id, input, {
    new: true,
    runValidators: true,
  });

  if (!feature) {
    throw new AppError('Feature not found.', 404);
  }

  return feature;
};

export const deleteFeature = async (id: string) => {
  const carsCount = await Car.countDocuments({ features: id });

  if (carsCount > 0) {
    throw new AppError(
      `Cannot delete Feature. There are ${carsCount} cars with this feature. Please update them first.`,
      400,
    );
  }

  const feature = await Feature.findByIdAndDelete(id);

  if (!feature) {
    throw new AppError('Feature not found.', 404);
  }
};

