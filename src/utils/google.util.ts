import { OAuth2Client } from 'google-auth-library';
import config from '../config/env.config.js';

const googleClient = new OAuth2Client(
  config.googleOAuth.clientId,
  config.googleOAuth.clientSecret,
  config.googleOAuth.redirectUri,
);

export default googleClient;
