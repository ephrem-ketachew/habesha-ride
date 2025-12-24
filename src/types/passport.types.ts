export interface UploadedImageFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
}

export interface PassportVerificationInput {
  passportImage: UploadedImageFile;
  selfieImage: UploadedImageFile;
}

export interface MRZData {
  valid: boolean;
  type: 'TD1' | 'TD2' | 'TD3' | null;
  format: string;
  documentCode: string;
  documentNumber: string;
  birthDate: string;
  birthDateCheckDigit: string;
  expirationDate: string;
  expirationDateCheckDigit: string;
  nationality: string;
  sex: 'M' | 'F' | 'X' | '';
  firstName: string;
  lastName: string;
  compositeCheckDigit?: string;
  optional1?: string;
  optional2?: string;
  issuingState?: string;
}

export interface ParsedPassportData {
  passportNumber: string;
  nationality: string;
  fullName: string;
  firstName: string;
  lastName: string;
  birthdate: string;
  expiryDate: string;
  sex: 'M' | 'F' | 'X';
  age: number;
  mrzRaw: string;
}

export interface BiometricResult {
  similarity: number;
  faceMatches: boolean;
  confidence: number;
  sourceImageFace?: {
    boundingBox: any;
    confidence: number;
  };
  targetImageFace?: {
    boundingBox: any;
    confidence: number;
  };
}

export interface PassportVerificationResult {
  approved: boolean;
  reason?: string;
  passportData?: ParsedPassportData;
  biometricResult?: BiometricResult;
  validations: {
    mrzValid: boolean;
    notExpired: boolean;
    ageValid: boolean;
    faceMatch: boolean;
  };
}

export interface GoogleVisionResponse {
  fullText: string;
  mrzLines: string[];
}
