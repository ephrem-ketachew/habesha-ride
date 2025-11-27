import City from '../models/city.model.js';
import Car from '../models/car.model.js';
import AppError from '../utils/appError.util.js';
import {
  GetCitiesQuery,
  CreateCityInput,
  UpdateCityInput,
} from '../validation/city.validation.js';

export const getCities = async (query: GetCitiesQuery) => {
  const { region, search, sortBy, page, limit } = query;

  const filter: any = { isActive: true };

  if (region) {
    filter.region = { $regex: new RegExp(region, 'i') };
  }

  if (search) {
    filter.name = { $regex: new RegExp(search, 'i') };
  }

  const sortOptions: any = {};
  if (sortBy === 'region') {
    sortOptions.region = 1;
    sortOptions.name = 1;
  } else {
    sortOptions.name = 1;
  }

  const skip = (page - 1) * limit;

  const cities = await City.find(filter)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);

  const total = await City.countDocuments(filter);

  return {
    cities,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalResults: total,
  };
};

export const getCitiesGroupedByRegion = async () => {
  const cities = await City.find({ isActive: true }).sort({
    region: 1,
    name: 1,
  });

  const grouped = cities.reduce(
    (acc, city) => {
      if (!acc[city.region]) {
        acc[city.region] = [];
      }
      acc[city.region].push({
        _id: city._id,
        name: city.name,
      });
      return acc;
    },
    {} as Record<string, Array<{ _id: any; name: string }>>,
  );

  return grouped;
};

export const getCityById = async (id: string) => {
  const city = await City.findById(id);

  if (!city) {
    throw new AppError('City not found.', 404);
  }

  return city;
};

export const createCity = async (input: CreateCityInput) => {
  const existing = await City.findOne({
    name: { $regex: new RegExp(`^${input.name}$`, 'i') },
  });

  if (existing) {
    throw new AppError(`City '${input.name}' already exists.`, 409);
  }

  const city = await City.create(input);
  return city;
};

export const updateCity = async (id: string, input: UpdateCityInput) => {
  if (input.name) {
    const existing = await City.findOne({
      name: { $regex: new RegExp(`^${input.name}$`, 'i') },
      _id: { $ne: id },
    });

    if (existing) {
      throw new AppError(`City '${input.name}' already exists.`, 409);
    }
  }

  const city = await City.findByIdAndUpdate(id, input, {
    new: true,
    runValidators: true,
  });

  if (!city) {
    throw new AppError('City not found.', 404);
  }

  return city;
};

export const deleteCity = async (id: string) => {
  const carsCount = await Car.countDocuments({ 'homeLocation.city': id });

  if (carsCount > 0) {
    throw new AppError(
      `Cannot delete City. There are ${carsCount} cars located in this city. Please update them first.`,
      400,
    );
  }

  const city = await City.findByIdAndDelete(id);

  if (!city) {
    throw new AppError('City not found.', 404);
  }
};

