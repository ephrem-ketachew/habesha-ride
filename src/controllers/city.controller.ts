import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.util.js';
import * as cityService from '../services/city.service.js';
import {
  GetCitiesQuery,
  GetCityParams,
} from '../validation/city.validation.js';

export const getCitiesHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query as unknown as GetCitiesQuery;
    const result = await cityService.getCities(query);

    res.status(200).json({
      status: 'success',
      results: result.cities.length,
      data: {
        cities: result.cities,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalResults: result.totalResults,
        },
      },
    });
  },
);

export const getCitiesGroupedByRegionHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const grouped = await cityService.getCitiesGroupedByRegion();

    res.status(200).json({
      status: 'success',
      data: {
        cities: grouped,
      },
    });
  },
);

export const getCityHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as GetCityParams;
    const city = await cityService.getCityById(id);

    res.status(200).json({
      status: 'success',
      data: {
        city,
      },
    });
  },
);

export const createCityHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const city = await cityService.createCity(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        city,
      },
    });
  },
);

export const updateCityHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as GetCityParams;
    const city = await cityService.updateCity(id, req.body);

    res.status(200).json({
      status: 'success',
      data: {
        city,
      },
    });
  },
);

export const deleteCityHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as GetCityParams;
    await cityService.deleteCity(id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  },
);
