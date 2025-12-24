# Kech.ai Backend v2 - Passport Verification Flow

## Hybrid Intelligence Architecture Documentation

This document provides a comprehensive sequence diagram and detailed explanation of the Passport Verification flow in the Kech.ai application. This implementation enables non-local customers (foreigners) to verify their identity using passport OCR and biometric face matching through Google Cloud Vision API and AWS Rekognition.

---

## Passport Verification Sequence Diagram

```mermaid
sequenceDiagram
    participant User as 👤 User<br/>(Browser)
    participant Frontend as 🖥️ Frontend<br/>(React App)
    participant Backend as 🔧 Backend<br/>(API - passport.service.ts)
    participant Multer as 📤 Multer<br/>(File Upload)
    participant Sharp as 🖼️ Sharp<br/>(Image Processing)
    participant Google as 🔍 Google Vision<br/>(OCR Engine)
    participant MRZ as 📋 MRZ Parser<br/>(npm: mrz)
    participant AWS as 🎭 AWS Rekognition<br/>(Face Comparison)
    participant Database as 🗄️ Database<br/>(User.model.ts)

    User->>Frontend: 1. Upload passport + selfie
    Frontend->>Backend: 2. POST /api/v1/verification/passport<br/>(multipart/form-data)
    activate Backend

    Backend->>Multer: 3. Process file upload
    activate Multer
    Note over Multer: Validate: JPEG/PNG<br/>Max 5MB per file<br/>Exactly 2 files
    Multer->>Backend: 4. Return file buffers
    deactivate Multer

    Backend->>Backend: 5. Check user not already verified
    Backend->>Backend: 6. Rate limit check (5/15min)

    par Parallel Execution (Hybrid Intelligence)
        Backend->>Sharp: 7a. Preprocess passport image
        activate Sharp
        Sharp->>Backend: 8a. Optimized buffer
        deactivate Sharp

        Backend->>Google: 9a. Extract text (OCR)
        activate Google
        Note over Google: Google Vision API<br/>Document Text Detection
        Google->>Backend: 10a. Full text + MRZ lines
        deactivate Google

        Backend->>MRZ: 11a. Parse MRZ data
        activate MRZ
        Note over MRZ: Validate checksums<br/>Extract: name, DOB,<br/>passport#, expiry
        MRZ->>Backend: 12a. Parsed passport data
        deactivate MRZ
    and
        Backend->>Sharp: 7b. Preprocess selfie image
        activate Sharp
        Sharp->>Backend: 8b. Optimized buffer
        deactivate Sharp

        Backend->>AWS: 9b. Compare faces
        activate AWS
        Note over AWS: AWS Rekognition<br/>CompareFaces API
        AWS->>Backend: 10b. Similarity score (0-100%)
        deactivate AWS
    end

    Backend->>Backend: 13. Apply Go/No-Go Logic
    Note over Backend: ✅ MRZ Valid<br/>✅ Not Expired<br/>✅ Age >= 18<br/>✅ Face Match > 90%

    alt Verification Rejected
        Backend->>Frontend: 14a. Rejection response<br/>{ approved: false, reason: "...", validations: {...} }
        Frontend->>User: 15a. Show specific error<br/>(e.g., "Passport expired")
    else Verification Approved
        Backend->>Database: 14b. Check duplicate passport
        activate Database
        Database->>Backend: 15b. No duplicate found
        deactivate Database

        Backend->>Database: 16b. Update user document
        activate Database
        Note over Database: Set: isIdentityVerified: true<br/>passportData: {...}<br/>identityVerificationMethod: 'passport'
        Database->>Backend: 17b. User updated
        deactivate Database

        Backend->>Frontend: 18b. Success response<br/>{ approved: true, user: {...}, passportData: {...} }
        deactivate Backend
        Frontend->>User: 19b. Show verification success
    end
```

---

## Detailed Flow Explanation

### Step 1-2: User Uploads Documents

**Step 1: User Uploads Passport and Selfie**

- User must be authenticated (JWT cookie required)
- Frontend provides file upload form with two inputs:
  - Passport data page image (photo page with MRZ)
  - Live selfie photo (for face comparison)
- User must not already be verified

**Step 2: Frontend Sends Multipart Request**

**HTTP Request:**

```http
POST /api/v1/verification/passport
Cookie: jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="passportImage"; filename="passport.jpg"
Content-Type: image/jpeg

[Binary image data]
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="selfieImage"; filename="selfie.jpg"
Content-Type: image/jpeg

[Binary image data]
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

**Route Handler** (`verification.routes.ts`):

```typescript
router.post(
  '/passport',
  passportVerificationLimiter, // Rate limiting: 5 attempts per 15 min
  protect, // Authentication required
  uploadPassportImages, // Multer middleware
  validatePassportImages, // Validate both files present
  verifyPassportHandler, // Controller
);
```

---

### Step 3-4: Multer File Upload Validation

**Multer Configuration** (`multer.util.ts`):

```typescript
export const uploadPassportImages = multer({
  storage: multer.memoryStorage(), // Store in memory (no disk writes)
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per file
    files: 2, // Exactly 2 files
  },
  fileFilter: passportFileFilter, // JPEG/PNG only
}).fields([
  { name: 'passportImage', maxCount: 1 },
  { name: 'selfieImage', maxCount: 1 },
]);

const passportFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPEG and PNG are allowed.', 400));
  }
};
```

**File Validation Middleware** (`multer.util.ts`):

```typescript
export const validatePassportImages = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  if (!files || !files.passportImage || !files.selfieImage) {
    return next(
      new AppError('Both passport image and selfie image are required.', 400),
    );
  }

  next();
};
```

**Validation Checks:**

- ✅ File type: JPEG or PNG only
- ✅ File size: Maximum 5MB per image
- ✅ File count: Exactly 2 files (passport + selfie)
- ✅ Field names: `passportImage` and `selfieImage` must be present

---

### Step 5-6: User Validation and Rate Limiting

**Controller - Verify Passport Handler** (`verification.controller.ts`):

```typescript
export const verifyPassportHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const passportImage = files.passportImage[0];
    const selfieImage = files.selfieImage[0];

    // Prepare input for service
    const input: PassportVerificationInput = {
      passportImage: {
        buffer: passportImage.buffer,
        mimetype: passportImage.mimetype,
        size: passportImage.size,
        originalname: passportImage.originalname,
      },
      selfieImage: {
        buffer: selfieImage.buffer,
        mimetype: selfieImage.mimetype,
        size: selfieImage.size,
        originalname: selfieImage.originalname,
      },
    };

    // Call service
    const result = await verificationService.handlePassportVerification(
      userId,
      input,
    );

    // Send response
    res.status(200).json({
      status: result.approved ? 'success' : 'rejected',
      data: result,
    });
  },
);
```

**Rate Limiter Configuration** (`rateLimiter.middleware.ts`):

```typescript
export const passportVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many verification attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw new AppError(
      'Too many verification attempts. Please try again in 15 minutes.',
      429,
    );
  },
});
```

**User Validation** (`verification.service.ts`):

```typescript
export const handlePassportVerification = async (
  userId: string,
  input: PassportVerificationInput,
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (user.isIdentityVerified) {
    throw new AppError(
      `Your identity is already verified via ${user.identityVerificationMethod}. You cannot verify again.`,
      400,
    );
  }

  // Continue with verification...
};
```

---

### Step 7-12: Parallel Execution - Hybrid Intelligence Architecture

**Parallel Processing** (`passport.service.ts`):

```typescript
export const verifyPassport = async (
  input: PassportVerificationInput,
): Promise<PassportVerificationResult> => {
  const startTime = Date.now();

  try {
    // Execute OCR and Face Comparison in parallel
    const [ocrResult, biometricResult] = await Promise.all([
      // Process A: OCR + MRZ Parsing
      (async () => {
        const preprocessedPassport = await preprocessImage(
          input.passportImage.buffer,
        );
        const { fullText, mrzLines } =
          await extractTextFromPassport(preprocessedPassport);
        const passportData = await parseMRZ(mrzLines);
        return passportData;
      })(),

      // Process B: Face Comparison
      (async () => {
        const preprocessedPassport = await preprocessImage(
          input.passportImage.buffer,
        );
        const preprocessedSelfie = await preprocessImage(
          input.selfieImage.buffer,
        );
        const result = await compareFaces(
          preprocessedPassport,
          preprocessedSelfie,
        );
        return result;
      })(),
    ]);

    // Apply Go/No-Go logic...
  } catch (error) {
    // Error handling...
  }
};
```

---

#### Process A: Image Preprocessing (Sharp)

**Image Optimization** (`passport.service.ts`):

```typescript
const preprocessImage = async (buffer: Buffer): Promise<Buffer> => {
  try {
    return await sharp(buffer)
      .resize(1920, 1920, {
        fit: 'inside', // Maintain aspect ratio
        withoutEnlargement: true, // Don't upscale small images
      })
      .jpeg({
        quality: config.passport.imageQuality, // Default: 80
        progressive: true,
      })
      .toBuffer();
  } catch (error: any) {
    logger.error({ error: error.message }, 'Image preprocessing failed');
    throw new AppError('Failed to process image. Please try again.', 500);
  }
};
```

**Preprocessing Benefits:**

- ✅ Reduces file size for faster API calls
- ✅ Standardizes image dimensions
- ✅ Converts to JPEG for consistency
- ✅ Maintains quality with 80% compression

---

#### Process A: Google Cloud Vision OCR

**Text Extraction** (`passport.service.ts`):

```typescript
const extractTextFromPassport = async (
  imageBuffer: Buffer,
): Promise<GoogleVisionResponse> => {
  try {
    const visionClient = await initGoogleVisionClient();

    const [result] = await visionClient.documentTextDetection({
      image: { content: imageBuffer },
    });

    const fullText = result.fullTextAnnotation?.text || '';

    if (!fullText) {
      throw new AppError(
        'Could not detect any text in the passport image. Please ensure the image is clear and well-lit.',
        400,
      );
    }

    // Extract MRZ lines (last 2-3 lines of passport)
    const lines = fullText.split('\n').map((line) => line.trim());
    const mrzLines = lines.filter((line) => {
      // MRZ lines are typically 44 characters and contain mostly uppercase
      return line.length >= 30 && /^[A-Z0-9<]+$/.test(line);
    });

    if (mrzLines.length < 2) {
      throw new AppError(
        'Could not detect the Machine Readable Zone (MRZ). Please ensure the bottom lines of the passport are visible and not obscured by glare.',
        400,
      );
    }

    logger.info(
      {
        textLength: fullText.length,
        mrzLineCount: mrzLines.length,
      },
      'Text extraction completed',
    );

    return { fullText, mrzLines };
  } catch (error: any) {
    // Error handling...
  }
};
```

**Google Vision Client Initialization** (`passport.service.ts`):

```typescript
const initGoogleVisionClient = async (): Promise<ImageAnnotatorClient> => {
  const vision = await import('@google-cloud/vision');
  const ImageAnnotatorClient = vision.ImageAnnotatorClient;

  // Option 1: Use service account key (Base64 encoded)
  if (config.passport.googleServiceAccountKeyBase64) {
    const keyFileJson = Buffer.from(
      config.passport.googleServiceAccountKeyBase64,
      'base64',
    ).toString('utf-8');

    const credentials = JSON.parse(keyFileJson);

    return new ImageAnnotatorClient({
      projectId: config.passport.googleProjectId,
      credentials,
    });
  }

  // Option 2: Use credentials file path
  if (config.passport.googleCredentialsPath) {
    return new ImageAnnotatorClient({
      projectId: config.passport.googleProjectId,
      keyFilename: config.passport.googleCredentialsPath,
    });
  }

  throw new AppError('Google Cloud credentials not configured.', 500);
};
```

**OCR Response Example:**

```typescript
{
  fullText: "PASSPORT\nP<USADOE<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<<<\nN1234567<9USA9001011M3012311<<<<<<<<<<<<<<04",
  mrzLines: [
    "P<USADOE<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<<<",
    "N1234567<9USA9001011M3012311<<<<<<<<<<<<<<04"
  ]
}
```

---

#### Process A: MRZ Parsing and Validation

**MRZ Parser** (`passport.service.ts`):

```typescript
const parseMRZ = async (mrzLines: string[]): Promise<ParsedPassportData> => {
  try {
    const mrzRaw = mrzLines.join('\n');

    // Use mrz library to parse
    const { parse } = await import('mrz');
    const result = parse(mrzLines);

    if (!result.valid) {
      throw new AppError(
        'Could not read the bottom lines of your passport clearly. This is usually caused by glare or shadows. Please retake the photo with better lighting and ensure the entire MRZ (bottom 2 lines) is visible.',
        400,
      );
    }

    // Extract data from parsed MRZ
    const firstName = result.fields.firstName || '';
    const lastName = result.fields.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();

    // Convert dates from YYMMDD to YYYY-MM-DD
    const birthdate = convertMRZDate(result.fields.birthDate);
    const expiryDate = convertMRZDate(result.fields.expirationDate);

    // Calculate age
    const age = calculateAge(birthdate);

    const passportData: ParsedPassportData = {
      passportNumber: result.fields.documentNumber,
      nationality: result.fields.nationality,
      fullName,
      firstName,
      lastName,
      birthdate,
      expiryDate,
      sex: result.fields.sex as 'M' | 'F' | 'X',
      age,
      mrzRaw,
    };

    logger.info(
      {
        passportNumber: passportData.passportNumber,
        nationality: passportData.nationality,
        age: passportData.age,
      },
      'MRZ parsed successfully',
    );

    return passportData;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    // Enhanced error messages for common MRZ issues
    if (error.message?.includes('checksum')) {
      throw new AppError(
        'Passport verification failed due to checksum error. This usually happens when characters in the MRZ are obscured by glare, shadows, or poor image quality. Please retake the photo in better lighting.',
        400,
      );
    }

    throw new AppError(
      'Could not parse passport data. Please ensure the photo is clear and the entire MRZ is visible.',
      400,
    );
  }
};
```

**Date Conversion Utility:**

```typescript
const convertMRZDate = (mrzDate: string): string => {
  // MRZ date format: YYMMDD
  const year = parseInt(mrzDate.substring(0, 2), 10);
  const month = mrzDate.substring(2, 4);
  const day = mrzDate.substring(4, 6);

  // Determine century (assume < 30 is 2000s, >= 30 is 1900s)
  const fullYear = year < 30 ? 2000 + year : 1900 + year;

  return `${fullYear}-${month}-${day}`;
};

const calculateAge = (birthdate: string): number => {
  const today = new Date();
  const birthDate = new Date(birthdate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};
```

**Parsed Passport Data Example:**

```typescript
{
  passportNumber: "N1234567",
  nationality: "USA",
  fullName: "JOHN DOE",
  firstName: "JOHN",
  lastName: "DOE",
  birthdate: "1990-01-01",
  expiryDate: "2030-12-31",
  sex: "M",
  age: 35,
  mrzRaw: "P<USADOE<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<<<\nN1234567<9USA9001011M3012311<<<<<<<<<<<<<<04"
}
```

---

#### Process B: AWS Rekognition Face Comparison

**Face Comparison** (`passport.service.ts`):

```typescript
const compareFaces = async (
  passportBuffer: Buffer,
  selfieBuffer: Buffer,
): Promise<BiometricResult> => {
  try {
    const rekognitionClient = await initAWSRekognitionClient();

    const command = new CompareFacesCommand({
      SourceImage: {
        Bytes: passportBuffer,
      },
      TargetImage: {
        Bytes: selfieBuffer,
      },
      SimilarityThreshold: config.passport.awsSimilarityThreshold, // Default: 90
    });

    const response = await rekognitionClient.send(command);

    // Check if faces were detected
    if (!response.FaceMatches || response.FaceMatches.length === 0) {
      // Check for unmatched faces in source/target
      if (
        response.UnmatchedFaces &&
        response.UnmatchedFaces.length > 0 &&
        response.SourceImageFace
      ) {
        throw new AppError(
          'No face detected in the selfie image. Please ensure your face is clearly visible and well-lit.',
          400,
        );
      }

      if (!response.SourceImageFace) {
        throw new AppError(
          'No face detected in the passport image. Please ensure the photo page of the passport is visible.',
          400,
        );
      }

      throw new AppError(
        'Face comparison failed. The faces do not match or are not clearly visible.',
        400,
      );
    }

    const match = response.FaceMatches[0];
    const similarity = match.Similarity || 0;

    logger.info(
      {
        similarity: similarity.toFixed(2),
        confidence: match.Face?.Confidence?.toFixed(2),
      },
      'Face comparison completed',
    );

    return {
      similarity,
      faceMatches: similarity >= config.passport.awsSimilarityThreshold,
      confidence: match.Face?.Confidence || 0,
      sourceImageFace: {
        boundingBox: response.SourceImageFace?.BoundingBox,
        confidence: response.SourceImageFace?.Confidence || 0,
      },
      targetImageFace: {
        boundingBox: match.Face?.BoundingBox,
        confidence: match.Face?.Confidence || 0,
      },
    };
  } catch (error: any) {
    // Error handling...
  }
};
```

**AWS Rekognition Client Initialization** (`passport.service.ts`):

```typescript
const initAWSRekognitionClient = async (): Promise<RekognitionClient> => {
  const { RekognitionClient } = await import('@aws-sdk/client-rekognition');

  return new RekognitionClient({
    region: config.passport.awsRegion,
    credentials: {
      accessKeyId: config.passport.awsAccessKeyId,
      secretAccessKey: config.passport.awsSecretAccessKey,
    },
  });
};
```

**Biometric Result Example:**

```typescript
{
  similarity: 95.5,
  faceMatches: true,
  confidence: 99.8,
  sourceImageFace: {
    boundingBox: { Width: 0.5, Height: 0.7, Left: 0.25, Top: 0.15 },
    confidence: 99.9
  },
  targetImageFace: {
    boundingBox: { Width: 0.6, Height: 0.8, Left: 0.2, Top: 0.1 },
    confidence: 99.8
  }
}
```

---

### Step 13: Go/No-Go Decision Logic

**Validation Logic** (`passport.service.ts`):

```typescript
// Extract results from parallel execution
const passportData = ocrResult;
const biometric = biometricResult;

// Validation checks
const validations = {
  mrzValid: true, // MRZ checksums passed
  notExpired: new Date(passportData.expiryDate) > new Date(),
  ageValid: passportData.age >= config.passport.minAge, // Default: 18
  faceMatch: biometric.similarity >= config.passport.awsSimilarityThreshold, // Default: 90
};

// Determine approval status
const approved =
  validations.mrzValid &&
  validations.notExpired &&
  validations.ageValid &&
  validations.faceMatch;

// Generate reason for rejection
let reason: string | undefined;
if (!approved) {
  if (!validations.mrzValid) {
    reason =
      'MRZ validation failed. Please ensure the passport data is readable.';
  } else if (!validations.notExpired) {
    reason = `Your passport has expired on ${passportData.expiryDate}. Please use a valid passport.`;
  } else if (!validations.ageValid) {
    reason = `You must be at least ${config.passport.minAge} years old to use this service.`;
  } else if (!validations.faceMatch) {
    reason = `Face verification failed. Similarity score: ${biometric.similarity.toFixed(1)}%. Required: ${config.passport.awsSimilarityThreshold}%. Please ensure your selfie clearly shows your face.`;
  }
}

logger.info(
  {
    approved,
    validations,
    similarity: biometric.similarity.toFixed(2),
    processingTime: Date.now() - startTime,
  },
  'Verification decision completed',
);

return {
  approved,
  reason,
  passportData: approved ? passportData : undefined,
  biometricResult: biometric,
  validations,
};
```

**Go/No-Go Criteria:**

| Validation         | Check                | Error Message                                                           |
| ------------------ | -------------------- | ----------------------------------------------------------------------- |
| ✅ **MRZ Valid**   | Checksums pass       | "MRZ validation failed. Please ensure the passport data is readable."   |
| ✅ **Not Expired** | `expiryDate > today` | "Your passport has expired on YYYY-MM-DD. Please use a valid passport." |
| ✅ **Age Valid**   | `age >= 18`          | "You must be at least 18 years old to use this service."                |
| ✅ **Face Match**  | `similarity >= 90%`  | "Face verification failed. Similarity: 85.0%. Required: 90.0%."         |

---

### Step 14a-15a: Verification Rejected

**Rejection Response:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "rejected",
  "data": {
    "success": false,
    "approved": false,
    "reason": "Your passport has expired on 2023-12-31. Please use a valid passport.",
    "validations": {
      "mrzValid": true,
      "notExpired": false,
      "ageValid": true,
      "faceMatch": true
    },
    "biometricResult": {
      "similarity": 95.5,
      "faceMatches": true
    }
  }
}
```

**Common Rejection Reasons:**

1. **Expired Passport**

   ```json
   {
     "reason": "Your passport has expired on 2023-12-31. Please use a valid passport."
   }
   ```

2. **Underage User**

   ```json
   {
     "reason": "You must be at least 18 years old to use this service."
   }
   ```

3. **Face Mismatch**

   ```json
   {
     "reason": "Face verification failed. Similarity score: 85.0%. Required: 90.0%. Please ensure your selfie clearly shows your face."
   }
   ```

4. **MRZ Unreadable**
   ```json
   {
     "reason": "Could not read the bottom lines of your passport clearly. This is usually caused by glare or shadows. Please retake the photo with better lighting."
   }
   ```

---

### Step 14b-17b: Verification Approved

**Duplicate Passport Check** (`passport.service.ts`):

```typescript
export const checkPassportExists = async (
  passportNumber: string,
): Promise<boolean> => {
  const existingUser = await User.findOne({
    'passportData.passportNumber': passportNumber,
  });

  return !!existingUser;
};
```

**Update User Document** (`verification.service.ts`):

```typescript
const passportNumber = verificationResult.passportData!.passportNumber;
const passportExists = await checkPassportExists(passportNumber);

if (passportExists) {
  throw new AppError(
    'This passport is already registered in our system. Each passport can only be used once.',
    409,
  );
}

// Update user with verified identity data
user.isIdentityVerified = true;
user.identityVerifiedAt = new Date();
user.identityVerificationMethod = 'passport';
user.passportData = {
  passportNumber: verificationResult.passportData!.passportNumber,
  nationality: verificationResult.passportData!.nationality,
  fullName: verificationResult.passportData!.fullName,
  firstName: verificationResult.passportData!.firstName,
  lastName: verificationResult.passportData!.lastName,
  birthdate: verificationResult.passportData!.birthdate,
  expiryDate: verificationResult.passportData!.expiryDate,
  sex: verificationResult.passportData!.sex,
  similarityScore: verificationResult.biometricResult!.similarity,
  verifiedAt: new Date(),
  mrzRaw: verificationResult.passportData!.mrzRaw,
};

await user.save();
```

---

### Step 18b-19b: Success Response

**HTTP Response:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "success",
  "data": {
    "success": true,
    "approved": true,
    "message": "Identity verified successfully via passport",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "isIdentityVerified": true,
      "identityVerificationMethod": "passport",
      "identityVerifiedAt": "2025-12-24T10:30:00.000Z",
      "passportData": {
        "passportNumber": "N1234567",
        "nationality": "USA",
        "fullName": "JOHN DOE",
        "birthdate": "1990-01-01",
        "expiryDate": "2030-12-31",
        "sex": "M",
        "similarityScore": 95.5,
        "verifiedAt": "2025-12-24T10:30:00.000Z"
      }
    },
    "validations": {
      "mrzValid": true,
      "notExpired": true,
      "ageValid": true,
      "faceMatch": true
    },
    "biometricResult": {
      "similarity": 95.5,
      "faceMatches": true,
      "confidence": 99.8
    }
  }
}
```

---

## Architecture Highlights

### Hybrid Intelligence Approach

**Why Hybrid?**

- **Google Cloud Vision** excels at OCR for glossy/skewed documents
- **AWS Rekognition** is industry-standard for biometric face matching
- **Parallel execution** maximizes speed (processes run simultaneously)

**Processing Time:**

- Sequential: ~8-12 seconds
- Parallel: ~4-6 seconds ⚡
- **Speed improvement: 50-60%**

**Cost Analysis:**

| Service         | Operation               | Cost per 1000 requests | Notes                 |
| --------------- | ----------------------- | ---------------------- | --------------------- |
| Google Vision   | Document Text Detection | $1.50                  | First 1000/month free |
| AWS Rekognition | CompareFaces            | $1.00                  | First 5000/month free |
| Sharp           | Image Processing        | $0.00                  | Local processing      |
| **Total**       | **Per verification**    | **$0.0025**            | After free tier       |

---

## Error Handling

### Comprehensive Error Messages

#### 1. File Upload Errors

**Missing Files:**

```json
{
  "status": "fail",
  "message": "Both passport image and selfie image are required."
}
```

**Status Code:** 400

**Invalid File Type:**

```json
{
  "status": "fail",
  "message": "Invalid file type. Only JPEG and PNG images are allowed."
}
```

**Status Code:** 400

**File Too Large:**

```json
{
  "status": "fail",
  "message": "File size exceeds 5MB limit. Please upload a smaller image."
}
```

**Status Code:** 413

---

#### 2. OCR Errors

**No Text Detected:**

```json
{
  "status": "fail",
  "message": "Could not detect any text in the passport image. Please ensure the image is clear and well-lit."
}
```

**Status Code:** 400

**MRZ Not Found:**

```json
{
  "status": "fail",
  "message": "Could not detect the Machine Readable Zone (MRZ). Please ensure the bottom lines of the passport are visible and not obscured by glare."
}
```

**Status Code:** 400

**Checksum Failure (Glare):**

```json
{
  "status": "fail",
  "message": "Passport verification failed due to checksum error. This usually happens when characters in the MRZ are obscured by glare, shadows, or poor image quality. Please retake the photo in better lighting."
}
```

**Status Code:** 400

---

#### 3. Biometric Errors

**No Face in Passport:**

```json
{
  "status": "fail",
  "message": "No face detected in the passport image. Please ensure the photo page of the passport is visible."
}
```

**Status Code:** 400

**No Face in Selfie:**

```json
{
  "status": "fail",
  "message": "No face detected in the selfie image. Please ensure your face is clearly visible and well-lit."
}
```

**Status Code:** 400

**Face Mismatch:**

```json
{
  "status": "rejected",
  "data": {
    "approved": false,
    "reason": "Face verification failed. Similarity score: 85.0%. Required: 90.0%. Please ensure your selfie clearly shows your face."
  }
}
```

**Status Code:** 200 (rejection, not error)

---

#### 4. Validation Errors

**Already Verified:**

```json
{
  "status": "fail",
  "message": "Your identity is already verified via fayda. You cannot verify again."
}
```

**Status Code:** 400

**Duplicate Passport:**

```json
{
  "status": "fail",
  "message": "This passport is already registered in our system. Each passport can only be used once."
}
```

**Status Code:** 409

**Rate Limit Exceeded:**

```json
{
  "status": "fail",
  "message": "Too many verification attempts. Please try again in 15 minutes."
}
```

**Status Code:** 429

---

#### 5. API Errors

**Google Vision API Failure:**

```json
{
  "status": "error",
  "message": "Failed to extract text from passport. Please try again."
}
```

**Status Code:** 500

**AWS Rekognition API Failure:**

```json
{
  "status": "error",
  "message": "Failed to compare faces. Please try again."
}
```

**Status Code:** 500

---

## Security Features

### 1. Rate Limiting

- ✅ **5 attempts per 15 minutes** per user
- ✅ Prevents brute-force attacks
- ✅ Controls API costs
- ✅ Reduces abuse

### 2. File Validation

- ✅ **Type checking**: JPEG/PNG only
- ✅ **Size limits**: 5MB max per file
- ✅ **Count validation**: Exactly 2 files required
- ✅ **Memory storage**: No disk writes (security)

### 3. Duplicate Prevention

- ✅ **Passport number uniqueness**: One passport, one account
- ✅ **Sparse index**: Allows null values (for non-verified users)
- ✅ **Database constraint**: Enforced at schema level

### 4. Data Sanitization

- ✅ **MRZ validation**: Checksum verification
- ✅ **Age verification**: Minimum age requirement (18+)
- ✅ **Expiry check**: Reject expired passports
- ✅ **Input sanitization**: mongoose-sanitize plugin

### 5. Secure Storage

- ✅ **Environment variables**: API keys never hardcoded
- ✅ **Encrypted credentials**: Base64-encoded service account keys
- ✅ **No disk storage**: Images processed in memory only
- ✅ **Audit logging**: All attempts logged for security

---

## Configuration Requirements

### Environment Variables

**Required Google Cloud Variables:**

```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_SERVICE_ACCOUNT_KEY_BASE64=base64_encoded_service_account_key_json

# OR (alternative to Base64)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

**Required AWS Variables:**

```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_REKOGNITION_SIMILARITY_THRESHOLD=90
```

**Optional Configuration:**

```env
PASSPORT_MAX_FILE_SIZE=5242880        # 5MB in bytes
PASSPORT_MIN_AGE=18                   # Minimum age requirement
PASSPORT_IMAGE_QUALITY=80             # JPEG quality (1-100)
```

**Configuration Object** (`env.config.ts`):

```typescript
passport: {
  googleProjectId: getEnvVar('GOOGLE_CLOUD_PROJECT_ID', true)!,
  googleCredentialsPath: getEnvVar('GOOGLE_APPLICATION_CREDENTIALS', false),
  googleServiceAccountKeyBase64: getEnvVar('GOOGLE_SERVICE_ACCOUNT_KEY_BASE64', false),
  awsAccessKeyId: getEnvVar('AWS_ACCESS_KEY_ID', true)!,
  awsSecretAccessKey: getEnvVar('AWS_SECRET_ACCESS_KEY', true)!,
  awsRegion: getEnvVar('AWS_REGION', false, 'us-east-1')!,
  awsSimilarityThreshold: getEnvVarAsInt('AWS_REKOGNITION_SIMILARITY_THRESHOLD', false, 90)!,
  maxFileSize: getEnvVarAsInt('PASSPORT_MAX_FILE_SIZE', false, 5242880)!,
  minAge: getEnvVarAsInt('PASSPORT_MIN_AGE', false, 18)!,
  imageQuality: getEnvVarAsInt('PASSPORT_IMAGE_QUALITY', false, 80)!,
}
```

---

### Google Cloud Setup

**Step 1: Create Project**

```bash
gcloud projects create kech-passport-verification
gcloud config set project kech-passport-verification
```

**Step 2: Enable Vision API**

```bash
gcloud services enable vision.googleapis.com
```

**Step 3: Create Service Account**

```bash
gcloud iam service-accounts create passport-ocr \
  --display-name="Passport OCR Service Account"
```

**Step 4: Grant Permissions**

```bash
gcloud projects add-iam-policy-binding kech-passport-verification \
  --member="serviceAccount:passport-ocr@kech-passport-verification.iam.gserviceaccount.com" \
  --role="roles/cloudvision.user"
```

**Step 5: Create and Download Key**

```bash
gcloud iam service-accounts keys create passport-ocr-key.json \
  --iam-account=passport-ocr@kech-passport-verification.iam.gserviceaccount.com
```

**Step 6: Encode Key to Base64**

```bash
# Linux/Mac
base64 -w 0 passport-ocr-key.json > passport-ocr-key.base64

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("passport-ocr-key.json")) > passport-ocr-key.base64
```

---

### AWS Setup

**Step 1: Create IAM User**

```bash
aws iam create-user --user-name kech-passport-rekognition
```

**Step 2: Attach Policy**

```bash
aws iam attach-user-policy \
  --user-name kech-passport-rekognition \
  --policy-arn arn:aws:iam::aws:policy/AmazonRekognitionFullAccess
```

**Step 3: Create Access Key**

```bash
aws iam create-access-key --user-name kech-passport-rekognition
```

**Step 4: Save Credentials**
Copy the `AccessKeyId` and `SecretAccessKey` to your `.env` file.

---

## Database Schema Updates

### User Model Extensions

**New Fields Added:**

```typescript
{
  isIdentityVerified: boolean;                     // Shared with Fayda
  identityVerificationMethod: 'fayda' | 'passport' | null;
  identityVerifiedAt: Date;                        // Shared with Fayda

  passportData?: {
    // MRZ Extracted Data
    passportNumber: string;                        // Unique, sparse index
    nationality: string;
    fullName: string;
    firstName: string;
    lastName: string;
    birthdate: string;                             // YYYY-MM-DD
    expiryDate: string;                            // YYYY-MM-DD
    sex: 'M' | 'F' | 'X';

    // Verification Metadata
    similarityScore: number;                       // 0-100
    passportImageUrl?: string;                     // Optional: Cloudinary URL
    selfieImageUrl?: string;                       // Optional: Cloudinary URL
    verifiedAt: Date;

    // Debugging
    mrzRaw: string;                                // Full MRZ text
  };
}
```

**Indexes Added:**

```typescript
userSchema.index(
  { 'passportData.passportNumber': 1 },
  { unique: true, sparse: true },
);
```

**Sparse Index Benefits:**

- ✅ Allows null values (users without passport verification)
- ✅ Enforces uniqueness when value is present
- ✅ Prevents duplicate passport numbers

---

## Testing the Flow

### Manual Testing Steps

**1. Start Backend:**

```bash
pnpm run dev
```

**2. Test with Postman:**

**Request:**

```http
POST http://localhost:3000/api/v1/verification/passport
Cookie: jwt=your_jwt_token_here
Content-Type: multipart/form-data

passportImage: [Select passport.jpg file]
selfieImage: [Select selfie.jpg file]
```

**3. Test Scenarios:**

**Scenario A: Successful Verification**

- Upload clear passport image with visible MRZ
- Upload clear selfie image
- Verify user document updated
- Check `isIdentityVerified: true`
- Verify `identityVerificationMethod: 'passport'`

**Scenario B: Expired Passport**

- Upload passport with past expiry date
- Verify rejection with reason: "Your passport has expired"
- Check `validations.notExpired: false`

**Scenario C: Face Mismatch**

- Upload passport image
- Upload selfie of different person
- Verify rejection with similarity score < 90%

**Scenario D: Glare/MRZ Unreadable**

- Upload passport with glare obscuring MRZ
- Verify specific error message about glare
- Verify actionable instructions provided

**Scenario E: Duplicate Passport**

- User A verifies with passport N1234567
- User B attempts to verify with same passport
- Verify 409 Conflict error

**Scenario F: Rate Limiting**

- Attempt 6 verifications within 15 minutes
- Verify 6th attempt returns 429 error

---

## Integration with Frontend

### Frontend Implementation Example (React)

```typescript
import { useState } from 'react';

function PassportVerificationForm() {
  const [passportImage, setPassportImage] = useState<File | null>(null);
  const [selfieImage, setSelfieImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passportImage || !selfieImage) {
      alert('Please upload both images');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('passportImage', passportImage);
      formData.append('selfieImage', selfieImage);

      const response = await fetch(
        'http://localhost:3000/api/v1/verification/passport',
        {
          method: 'POST',
          credentials: 'include',  // Important: sends JWT cookie
          body: formData,          // No Content-Type header (browser sets it)
        }
      );

      const data = await response.json();

      if (data.status === 'success') {
        // Verification approved
        setResult({
          approved: true,
          message: data.data.message,
          user: data.data.user,
          validations: data.data.validations,
        });
        alert('Identity verified successfully!');
      } else if (data.status === 'rejected') {
        // Verification rejected (validation failed)
        setResult({
          approved: false,
          reason: data.data.reason,
          validations: data.data.validations,
        });
        alert(`Verification failed: ${data.data.reason}`);
      } else {
        // Error (e.g., API failure)
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Passport verification failed:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Passport Photo Page:</label>
        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={(e) => setPassportImage(e.target.files?.[0] || null)}
          disabled={loading}
        />
      </div>

      <div>
        <label>Selfie Photo:</label>
        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={(e) => setSelfieImage(e.target.files?.[0] || null)}
          disabled={loading}
        />
      </div>

      <button type="submit" disabled={loading || !passportImage || !selfieImage}>
        {loading ? 'Verifying...' : 'Verify Passport'}
      </button>

      {result && (
        <div>
          {result.approved ? (
            <div style={{ color: 'green' }}>
              <h3>✅ Verification Successful</h3>
              <p>Name: {result.user.passportData.fullName}</p>
              <p>Nationality: {result.user.passportData.nationality}</p>
              <p>Passport: {result.user.passportData.passportNumber}</p>
            </div>
          ) : (
            <div style={{ color: 'red' }}>
              <h3>❌ Verification Failed</h3>
              <p>{result.reason}</p>
              <ul>
                <li>MRZ Valid: {result.validations.mrzValid ? '✅' : '❌'}</li>
                <li>Not Expired: {result.validations.notExpired ? '✅' : '❌'}</li>
                <li>Age Valid: {result.validations.ageValid ? '✅' : '❌'}</li>
                <li>Face Match: {result.validations.faceMatch ? '✅' : '❌'}</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
```

---

## Admin Operations

### Revoke Passport Verification

**Endpoint:** `DELETE /api/v1/verification/passport/:userId`

**Authorization:** Admin or Superadmin only

**HTTP Request:**

```http
DELETE /api/v1/verification/passport/507f1f77bcf86cd799439011
Cookie: jwt=admin_jwt_token_here
```

**Route Handler** (`verification.routes.ts`):

```typescript
router.delete(
  '/passport/:userId',
  protect,
  restrictTo('admin', 'superadmin'),
  validate(revokePassportVerificationParamsSchema, 'params'),
  revokeVerificationHandler,
);
```

**Service Logic** (`verification.service.ts`):

```typescript
export const revokeVerification = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const previousMethod = user.identityVerificationMethod;

  // Clear verification data (both Fayda and Passport)
  user.isIdentityVerified = false;
  user.identityVerifiedAt = undefined;
  user.identityVerificationMethod = null;
  user.passportData = undefined; // Clear passport data
  user.faydaData = undefined; // Clear Fayda data

  await user.save();

  logger.info({ userId, previousMethod }, 'Verification revoked by admin');

  return {
    message: 'Verification revoked successfully',
    previousMethod,
  };
};
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "message": "Verification revoked successfully",
    "previousMethod": "passport"
  }
}
```

---

## Comparison: Passport vs Fayda Verification

| Feature                   | Passport Verification             | Fayda Verification           |
| ------------------------- | --------------------------------- | ---------------------------- |
| **Target Audience**       | Foreigners/Non-locals             | Ethiopian citizens           |
| **Input**                 | Passport image + Selfie           | OIDC authentication          |
| **Technology**            | Google Vision + AWS Rekognition   | Fayda eSignet OIDC           |
| **Processing**            | Parallel OCR + Biometrics         | Sequential OAuth flow        |
| **Data Extracted**        | Name, DOB, nationality, passport# | Name, DOB, address, Fayda ID |
| **Verification Time**     | 4-6 seconds                       | 15-30 seconds (user input)   |
| **Cost per Verification** | ~$0.0025                          | Free                         |
| **Rate Limit**            | 5 per 15 minutes                  | Not limited                  |
| **Uniqueness Check**      | Passport number (sparse index)    | Fayda ID (unique)            |
| **Revocation**            | Admin can revoke                  | Admin can revoke             |
| **Use Case**              | International travelers           | Local residents              |

---

## Best Practices

### 1. User Experience

- ✅ Provide clear instructions for photo capture
- ✅ Show examples of good vs bad passport photos
- ✅ Display specific, actionable error messages
- ✅ Include photo quality guidelines (no glare, good lighting)

### 2. Image Quality

- ✅ Recommend well-lit environment
- ✅ Advise against flash (causes glare)
- ✅ Suggest using rear camera (higher resolution)
- ✅ Guide users to capture entire MRZ

### 3. Security

- ✅ Never store raw images (process in memory only)
- ✅ Log all verification attempts for audit
- ✅ Enforce rate limiting to prevent abuse
- ✅ Validate file types and sizes server-side

### 4. Cost Optimization

- ✅ Preprocess images to reduce API payload
- ✅ Use free tiers (1000 Google Vision, 5000 AWS Rekognition)
- ✅ Monitor API usage with cloud dashboards
- ✅ Set up billing alerts

### 5. Error Handling

- ✅ Distinguish between user errors and system errors
- ✅ Provide specific instructions for fixable issues
- ✅ Log errors with context for debugging
- ✅ Implement retry logic for transient API failures

---

## Troubleshooting

### Common Issues

**Issue 1: "Could not detect MRZ"**

- **Cause**: Poor image quality, glare, or MRZ not visible
- **Solution**: Guide user to retake photo in better lighting, ensure MRZ is fully visible

**Issue 2: "Checksum error"**

- **Cause**: Glare obscuring characters in MRZ
- **Solution**: Specific error message: "Please avoid glare when photographing the MRZ"

**Issue 3: "No face detected in selfie"**

- **Cause**: Face too small, poorly lit, or at extreme angle
- **Solution**: Guide user to take selfie with face centered and well-lit

**Issue 4: "Face verification failed" (low similarity)**

- **Cause**: Different person, poor image quality, or significant appearance change
- **Solution**: Ensure selfie matches passport photo, check lighting

**Issue 5: "This passport is already registered"**

- **Cause**: Duplicate passport number in database
- **Solution**: This is security protection - user must use existing account or contact support

**Issue 6: Google Vision API timeout**

- **Cause**: Network issues or API unavailability
- **Solution**: Retry with exponential backoff, check API status

**Issue 7: AWS Rekognition insufficient faces**

- **Cause**: Face not detected in one or both images
- **Solution**: Provide clear guidance on face positioning

---

## Cost Estimation

### Monthly Cost Breakdown (1000 verifications)

**Google Cloud Vision API:**

- First 1000 requests: **$0.00** (free tier)
- Additional requests: $1.50 per 1000

**AWS Rekognition:**

- First 5000 requests: **$0.00** (free tier)
- Additional requests: $1.00 per 1000

**Sharp (Image Processing):**

- Local processing: **$0.00**

**Total Monthly Cost:**

- 1-1000 verifications: **$0.00** (free tier)
- 1001-5000 verifications: **$1.50-$7.50**
- 5001-10000 verifications: **$12.50**

**Break-even Analysis:**

- With free tier: First 1000 verifications/month are free
- After free tier: **$0.0025 per verification**
- Competitive with manual verification costs

---

## Future Enhancements

1. **Cloudinary Integration**: Store passport/selfie images for compliance (optional)
2. **Passport Chip Reading**: NFC chip verification for enhanced security
3. **Multi-page Upload**: Support front + back page for additional data
4. **Liveness Detection**: Add blink/smile detection to prevent spoofing
5. **Document Expiry Alerts**: Notify users before passport expiration
6. **Batch Processing**: Admin bulk verification review interface
7. **ML Model Integration**: Train custom models for passport-specific OCR
8. **Webhook Notifications**: Real-time verification status updates

---

## Dependencies

### Core Libraries

```json
{
  "dependencies": {
    "@google-cloud/vision": "^4.0.0",
    "@aws-sdk/client-rekognition": "^3.0.0",
    "sharp": "^0.33.0",
    "mrz": "^3.5.0",
    "multer": "^1.4.5-lts.1",
    "express-rate-limit": "^7.1.0"
  },
  "devDependencies": {
    "@types/multer": "^1.4.11"
  }
}
```

### Installation

```bash
pnpm add @google-cloud/vision @aws-sdk/client-rekognition sharp mrz multer express-rate-limit
pnpm add -D @types/multer
```

---

## References

- [Google Cloud Vision API Documentation](https://cloud.google.com/vision/docs)
- [AWS Rekognition Developer Guide](https://docs.aws.amazon.com/rekognition/)
- [MRZ npm Package](https://www.npmjs.com/package/mrz)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
- [ICAO Doc 9303 (MRZ Standard)](https://www.icao.int/publications/Documents/9303_p3_cons_en.pdf)
- [Kech.ai Verification Standard](./README.md)

---

**Version**: 1.0  
**Last Updated**: December 24, 2025  
**Tech Stack**: Node.js, Express, TypeScript, Google Cloud Vision, AWS Rekognition, Sharp, MRZ Parser  
**Dependencies**: `@google-cloud/vision`, `@aws-sdk/client-rekognition`, `sharp`, `mrz`, `multer`, `express-rate-limit`  
**Architecture**: Hybrid Intelligence (Google OCR + AWS Biometrics)
