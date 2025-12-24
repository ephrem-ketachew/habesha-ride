import express, { Express, Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import config from './config/env.config.js';
import logger from './config/logger.config.js';
import swaggerSpec from './config/swagger.js';
import AppError from './utils/appError.util.js';
import { globalErrorHandler } from './middleware/error.middleware.js';
import { handleMulterError } from './utils/multer.util.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import carRoutes from './routes/car.routes.js';
import makeRoutes from './routes/make.routes.js';
import modelRoutes from './routes/model.routes.js';
import cityRoutes from './routes/city.routes.js';
import featureRoutes from './routes/feature.routes.js';
import adminRoutes from './routes/admin.routes.js';
import rentalRoutes from './routes/rental.routes.js';
import saleRoutes from './routes/sale.routes.js';
import listingRoutes from './routes/listing.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import verificationRoutes from './routes/verification.routes.js';
import { chapaWebhookHandler } from './controllers/payment.controller.js';
import analyticsRoutes from './routes/analytics.routes.js';

const app: Express = express();

app.enable('trust proxy');

app.use(helmet());

const morganStream = {
  write: (message: string) => logger.debug(message.trim()),
};

if (!config.isProduction) {
  app.use(morgan('dev', { stream: morganStream }));
} else {
  app.use(morgan('short', { stream: morganStream }));
}

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
);

app.use(cookieParser(config.jwt.secret)); // Use JWT secret for signed cookies

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after an hour.',
  standardHeaders: true,
  legacyHeaders: false,
});

// app.use('/api', limiter);

app.post(
  '/api/v1/payments/webhook',
  express.raw({ type: 'application/json' }),
  chapaWebhookHandler,
);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/cars', carRoutes);
app.use('/api/v1/makes', makeRoutes);
app.use('/api/v1/models', modelRoutes);
app.use('/api/v1/cities', cityRoutes);
app.use('/api/v1/features', featureRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/listings/rent', rentalRoutes);
app.use('/api/v1/listings/sale', saleRoutes);
app.use('/api/v1/listings', listingRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/verification', verificationRoutes);

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Kech.ai v2.0 MVP Backend is running!',
  });
});

app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(handleMulterError);

app.use(globalErrorHandler);

export default app;
