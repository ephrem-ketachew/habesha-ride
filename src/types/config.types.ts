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
interface SuperAdminConfig {
  email?: string;
  password?: string;
  phone?: string;
}

interface GoogleOAuthConfig {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
}

interface ChapaConfig {
  secretKey: string;
  publicKey?: string;
  webhookSecret: string;
  baseUrl: string;
}

interface PaymentConfig {
  callbackUrl: string;
  returnUrl: string;
  webhookUrl: string;
}

interface FaydaConfig {
  clientId: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userinfoEndpoint: string;
  redirectUri: string;
  privateKeyBase64: string;
  claimsLocales: string;
}

interface PassportConfig {
  googleProjectId: string;
  googleCredentialsPath?: string;
  googleServiceAccountKeyBase64?: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
  awsSimilarityThreshold: number;
  maxFileSize: number;
  minAge: number;
  imageQuality: number;
}

export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  isProduction: boolean;
  port: number;

  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'trace';

  corsOrigin: string[];
  clientUrl: string;
  mongo: MongoConfig;
  jwt: JwtConfig;
  emailFrom: string;
  cloudinary: CloudinaryConfig;
  mailtrap: MailtrapConfig;
  brevo: BrevoConfig;
  googleOAuth: GoogleOAuthConfig;
  superAdmin: SuperAdminConfig;
  chapa: ChapaConfig;
  payment: PaymentConfig;
  fayda: FaydaConfig;
  passport: PassportConfig;
}
