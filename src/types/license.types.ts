export interface UploadedImageFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
}

export interface LicenseVerificationInput {
  frontImage: UploadedImageFile;
  backImage?: UploadedImageFile;
  licenseType: 'ethiopian' | 'international';
}

export interface ParsedLicenseData {
  licenseNumber: string;
  fullName: string;
  birthdate: string;
  expiryDate: string;
  issueDate?: string;
  licenseClass: string[];
  bloodType?: string;
  nationality: string;
  countryOfIssue: string;
  isInternationalLicense: boolean;
  ocrRawFront: string;
  ocrRawBack?: string;
}

export interface LicenseMatchingResult {
  nameMatch: boolean;
  nameMatchScore: number;
  dobMatch: boolean;
  identitySource: 'fayda' | 'passport';
}

export interface LicenseValidations {
  ocrSuccess: boolean;
  notExpired: boolean;
  nameMatch: boolean;
  dobMatch: boolean;
  licenseClassValid: boolean;
}

export interface LicenseVerificationResult {
  approved: boolean;
  reason?: string;
  licenseData?: ParsedLicenseData;
  matchingResult?: LicenseMatchingResult;
  validations: LicenseValidations;
}

export interface LicenseVerificationResponse {
  success: boolean;
  approved: boolean;
  message?: string;
  reason?: string;
  user?: {
    id: string;
    isDrivingLicenseVerified: boolean;
    licenseData?: {
      licenseNumber: string;
      fullName: string;
      birthdate: string;
      expiryDate: string;
      licenseClass: string[];
      nationality: string;
      nameMatchScore: number;
      dobMatch: boolean;
      verifiedAt: Date;
    };
  };
  validations: LicenseValidations;
}

export interface OcrResult {
  frontText: string;
  backText?: string;
}

export interface EthiopianLicenseData {
  licenseNumber: string;
  fullName: string;
  nameAmharic?: string;
  birthdate: string;
  expiryDate: string;
  issueDate?: string;
  licenseClass: string[];
  bloodType?: string;
}

export interface InternationalLicenseData {
  licenseNumber: string;
  fullName: string;
  birthdate: string;
  expiryDate: string;
  issueDate?: string;
  licenseClass: string[];
  countryOfIssue: string;
}
