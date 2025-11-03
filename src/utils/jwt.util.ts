import Jwt from 'jsonwebtoken';
import config from '../config/env.config.js';

export const signToken = (userId: string): string => {
  const token = Jwt.sign({ id: userId }, config.jwt.secret, {
    expiresIn: parseInt(config.jwt.expiresIn, 10),
  });
  return token;
};
