import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { AppConfig } from '../types/config.types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../config.env') });

const getEnvVar = (
  key: string,
  required: boolean = true,
  defaultValue?: string,
): string | undefined => {
  const value = process.env[key];

  if (required && (value === undefined || value === null || value === '')) {
    console.error(
      `💥 FATAL ERROR: Required environment variable "${key}" is not set.`,
    );
    process.exit(1);
  }

  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  return value;
};

const getEnvVarAsInt = (
  key: string,
  required: boolean = true,
  defaultValue?: number,
): number | undefined => {
  const valueStr = getEnvVar(key, required, defaultValue?.toString());
  if (valueStr === undefined) return undefined;

  const valueInt = parseInt(valueStr, 10);
  if (isNaN(valueInt)) {
    console.error(
      `💥 FATAL ERROR: Environment variable "${key}" must be an integer! Found: ${valueStr}`,
    );
    process.exit(1);
  }
  return valueInt;
};

const nodeEnv = getEnvVar('NODE_ENV', false, 'development');
const isProduction = nodeEnv === 'production';
const defaultLogLevel = isProduction ? 'info' : 'debug';

const config: AppConfig = {
  nodeEnv: nodeEnv as AppConfig['nodeEnv'],
  isProduction: isProduction,
  port: getEnvVarAsInt('PORT', true, 3000)!,
  logLevel: getEnvVar(
    'LOG_LEVEL',
    false,
    defaultLogLevel,
  ) as AppConfig['logLevel'],

  corsOrigin: getEnvVar('CORS_ORIGIN', isProduction, 'http://localhost:3000')!
    .split(',')
    .map((origin) => origin.trim()),

  clientUrl: getEnvVar('CLIENT_URL', isProduction, 'http://localhost:3000')!,

  mongo: {
    uriTemplate: getEnvVar('DATABASE_URL', true)!,
    password: getEnvVar('DATABASE_PASSWORD', true)!,
  },

  jwt: {
    secret: getEnvVar('JWT_SECRET', true)!,
    expiresIn: getEnvVar('JWT_EXPIRES_IN', true, '90d')!,
  },

  emailFrom: getEnvVar('EMAIL_FROM', true)!,

  cloudinary: {
    cloudName: getEnvVar('CLOUDINARY_CLOUD_NAME', false),
    apiKey: getEnvVar('CLOUDINARY_API_KEY', false),
    apiSecret: getEnvVar('CLOUDINARY_API_SECRET', false),
  },

  mailtrap: {
    host: getEnvVar('MAILTRAP_HOST', false),
    port: getEnvVarAsInt('MAILTRAP_PORT', false),
    username: getEnvVar('MAILTRAP_USERNAME', false),
    password: getEnvVar('MAILTRAP_PASSWORD', false),
  },

  brevo: {
    host: getEnvVar('BREVO_HOST', false),
    port: getEnvVarAsInt('BREVO_PORT', false),
    user: getEnvVar('BREVO_USER', false),
    smtpKey: getEnvVar('BREVO_SMTP_KEY', false),
  },

  googleOAuth: {
    clientId: getEnvVar('GOOGLE_CLIENT_ID', false),
    clientSecret: getEnvVar('GOOGLE_CLIENT_SECRET', false),
    redirectUri: getEnvVar('GOOGLE_REDIRECT_URI', false, 'postmessage'),
  },

  superAdmin: {
    email: getEnvVar('SUPER_ADMIN_EMAIL', false),
    password: getEnvVar('SUPER_ADMIN_PASSWORD', false),
    phone: getEnvVar('SUPER_ADMIN_PHONE', false),
  },
};

export default isProduction ? Object.freeze(config) : config;
