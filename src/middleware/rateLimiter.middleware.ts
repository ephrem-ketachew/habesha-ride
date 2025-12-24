import rateLimit from 'express-rate-limit';
import logger from '../config/logger.config.js';

export const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after an hour.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(
      {
        ip: req.ip,
        path: req.path,
      },
      'Rate limit exceeded',
    );
    res.status(429).json({
      status: 'fail',
      message:
        'Too many requests from this IP, please try again after an hour.',
    });
  },
});

export const passportVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many verification attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    logger.warn(
      {
        ip: req.ip,
        userId: req.user?.id || 'anonymous',
        userAgent: req.get('user-agent'),
      },
      'Passport verification rate limit exceeded',
    );
    res.status(429).json({
      status: 'fail',
      message:
        'Too many verification attempts. Please wait 15 minutes before trying again. If you continue to have issues, please contact support.',
    });
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.warn(
      {
        ip: req.ip,
        path: req.path,
      },
      'Auth rate limit exceeded',
    );
    res.status(429).json({
      status: 'fail',
      message:
        'Too many authentication attempts. Please try again in 15 minutes.',
    });
  },
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Too many file uploads. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(
      {
        ip: req.ip,
        path: req.path,
      },
      'Upload rate limit exceeded',
    );
    res.status(429).json({
      status: 'fail',
      message: 'Too many file uploads. Please try again in an hour.',
    });
  },
});
