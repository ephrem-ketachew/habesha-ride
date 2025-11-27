import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.util.js';
import * as featureService from '../services/feature.service.js';
import {
  GetFeaturesQuery,
  GetFeatureParams,
} from '../validation/feature.validation.js';

export const getFeaturesHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query as unknown as GetFeaturesQuery;
    const result = await featureService.getFeatures(query);

    res.status(200).json({
      status: 'success',
      results: result.features.length,
      data: {
        features: result.features,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalResults: result.totalResults,
        },
      },
    });
  },
);

export const getFeatureHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as GetFeatureParams;
    const feature = await featureService.getFeatureById(id);

    res.status(200).json({
      status: 'success',
      data: {
        feature,
      },
    });
  },
);

export const createFeatureHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const feature = await featureService.createFeature(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        feature,
      },
    });
  },
);

export const updateFeatureHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as GetFeatureParams;
    const feature = await featureService.updateFeature(id, req.body);

    res.status(200).json({
      status: 'success',
      data: {
        feature,
      },
    });
  },
);

export const deleteFeatureHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as GetFeatureParams;
    await featureService.deleteFeature(id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  },
);

