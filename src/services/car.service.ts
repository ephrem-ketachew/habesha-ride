import Car from '../models/car.model.js';
import { CreateCarInput } from '../validation/car.validation.js';
import { ICarPhoto } from '../types/car.types.js';

export const createCar = async (
  input: CreateCarInput,
  files: Express.Multer.File[],
  ownerId: string,
) => {
  const photos: ICarPhoto[] = files.map((file, index) => ({
    url: file.path,
    isPrimary: index === 0,
  }));

  const carData = {
    ...input,
    photos,
    owner: ownerId,
    verificationStatus: 'pending',
  };

  const car = await Car.create(carData);
  return car;
};
