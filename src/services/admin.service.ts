import Car from '../models/car.model.js';
import Make from '../models/make.model.js';
import VehicleModel from '../models/vehicleModel.model.js';
import AppError from '../utils/appError.util.js';
import {
  CreateMakeInput,
  UpdateMakeInput,
  CreateModelInput,
  UpdateModelInput,
} from '../validation/admin.validation.js';

export const createMake = async (input: CreateMakeInput) => {
  const existing = await Make.findOne({
    name: { $regex: new RegExp(`^${input.name}$`, 'i') },
  });

  if (existing) {
    throw new AppError(`Make '${input.name}' already exists.`, 409);
  }

  const make = await Make.create(input);
  return make;
};

export const updateMake = async (id: string, input: UpdateMakeInput) => {
  const make = await Make.findByIdAndUpdate(id, input, {
    new: true,
    runValidators: true,
  });

  if (!make) {
    throw new AppError('Make not found.', 404);
  }

  return make;
};

export const createModel = async (input: CreateModelInput) => {
  const make = await Make.findById(input.make);
  if (!make) {
    throw new AppError('Make not found.', 404);
  }

  const existing = await VehicleModel.findOne({
    name: { $regex: new RegExp(`^${input.name}$`, 'i') },
    make: input.make,
  });

  if (existing) {
    throw new AppError(
      `Model '${input.name}' already exists for ${make.name}.`,
      409,
    );
  }

  const model = await VehicleModel.create(input);
  return model;
};

export const updateModel = async (id: string, input: UpdateModelInput) => {
  if (input.name) {
    const currentModel = await VehicleModel.findById(id);
    if (!currentModel) {
      throw new AppError('Model not found.', 404);
    }

    const existing = await VehicleModel.findOne({
      name: { $regex: new RegExp(`^${input.name}$`, 'i') },
      make: currentModel.make,
      _id: { $ne: id },
    });

    if (existing) {
      throw new AppError(
        `Model '${input.name}' already exists for this make.`,
        409,
      );
    }
  }

  const model = await VehicleModel.findByIdAndUpdate(id, input, {
    new: true,
    runValidators: true,
  });

  if (!model) {
    throw new AppError('Model not found.', 404);
  }

  return model;
};

export const deleteMake = async (id: string) => {
  const modelsCount = await VehicleModel.countDocuments({ make: id });
  if (modelsCount > 0) {
    throw new AppError(
      `Cannot delete Make. It has ${modelsCount} associated models. Please delete them first.`,
      400,
    );
  }

  const carsCount = await Car.countDocuments({ make: id });
  if (carsCount > 0) {
    throw new AppError(
      `Cannot delete Make. There are ${carsCount} cars listed under this make.`,
      400,
    );
  }

  const make = await Make.findByIdAndDelete(id);
  if (!make) {
    throw new AppError('Make not found.', 404);
  }
};

export const deleteModel = async (id: string) => {
  const carsCount = await Car.countDocuments({ vehicleModel: id });
  if (carsCount > 0) {
    throw new AppError(
      `Cannot delete Model. There are ${carsCount} cars listed as this model.`,
      400,
    );
  }

  const model = await VehicleModel.findByIdAndDelete(id);
  if (!model) {
    throw new AppError('Model not found.', 404);
  }
};
