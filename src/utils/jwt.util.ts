import Jwt from 'jsonwebtoken';
import config from '../config/env.config.js';
import logger from '@/config/logger.config.js';

export const signToken = (userId: string): string => {
  const token = Jwt.sign({ id: userId }, config.jwt.secret, {
    expiresIn: parseInt(config.jwt.expiresIn, 10),
  });
  logger.debug(
    `Generated JWT for user ${userId} with expiration ${config.jwt.expiresIn}`,
  );
  return token;
};
