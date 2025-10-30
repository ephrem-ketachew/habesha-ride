interface MongoConfig {
  uriTemplate: string;
  password: string;
}

interface JwtConfig {
  secret: string;
  expiresIn: string;
}

interface CloudinaryConfig {
  cloudName?: string;
  apiKey?: string;
  apiSecret?: string;
}

interface MailtrapConfig {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
}

interface BrevoConfig {
  host?: string;
  port?: number;
  user?: string;
  smtpKey?: string;
}

interface GoogleOAuthConfig {
  clientId?: string;
  clientSecret?: string;
}

export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  isProduction: boolean;
  port: number;

  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'trace';

  corsOrigin: string;
  clientUrl: string;
  mongo: MongoConfig;
  jwt: JwtConfig;
  emailFrom: string;
  cloudinary: CloudinaryConfig;
  mailtrap: MailtrapConfig;
  brevo: BrevoConfig;
  googleOAuth: GoogleOAuthConfig;
}
