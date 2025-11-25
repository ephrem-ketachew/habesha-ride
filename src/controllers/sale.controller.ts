import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.util.js';
import * as saleService from '../services/sale.service.js';
import {
  CreateSaleListingInput,
  UpdateSaleListingInput,
  GetSaleListingsQuery,
} from '../validation/sale.validation.js';


export const createSaleListingHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const listing = await saleService.createSaleListing(
      req.user!.id,
      req.body as CreateSaleListingInput,
    );

    res.status(201).json({
      status: 'success',
      data: { listing },
    });
  },
);


export const getMySaleListingsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const listings = await saleService.getMySaleListings(req.user!.id);

    res.status(200).json({
      status: 'success',
      results: listings.length,
      data: { listings },
    });
  },
);


export const getPublicSaleListingsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query as unknown as GetSaleListingsQuery;
    const data = await saleService.getPublicSaleListings(query);

    res.status(200).json({
      status: 'success',
      ...data,
    });
  },
);


export const getSaleListingDetailsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const viewerId = req.user?.id;

    const listing = await saleService.getSaleListingById(id, viewerId);

    res.status(200).json({
      status: 'success',
      data: { listing },
    });
  },
);


export const updateSaleListingHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const listing = await saleService.updateSaleListing(
      req.user!.id,
      id,
      req.body as UpdateSaleListingInput,
    );

    res.status(200).json({
      status: 'success',
      data: { listing },
    });
  },
);


export const deleteSaleListingHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    await saleService.deleteSaleListing(req.user!.id, id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  },
);
