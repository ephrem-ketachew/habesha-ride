import express, { Express, Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
// @ts-ignore
import xss from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';

import config from './config/index.js';
import logger from './utils/logger.js';
import AppError from './utils/appError.js';
import { globalErrorHandler } from './middleware/errorHandler.js';

const app: Express = express();

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

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after an hour.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(mongoSanitize());
app.use(xss());

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Kech.ai v2.0 MVP Backend is running!',
  });
});

app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
