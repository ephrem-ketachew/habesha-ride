# Habesha Ride Backend v2 - Fayda (eSignet) Identity Verification Flow

## Fayda OIDC Integration Documentation

This document provides a comprehensive sequence diagram and detailed explanation of the Fayda (eSignet) OIDC identity verification flow in the Habesha Ride application. This implementation enables Ethiopian citizens and residents to verify their national ID through the government's Fayda system.

---

## Fayda Verification Sequence Diagram

```mermaid
sequenceDiagram
    participant User as 👤 User<br/>(Browser)
    participant Frontend as 🖥️ Frontend<br/>(React App)
    participant Backend as 🔧 Backend<br/>(API - verification.service.ts)
    participant Fayda as 🛡️ Fayda eSignet<br/>(OIDC Provider)
    participant Database as 🗄️ Database<br/>(User.model.ts)

    User->>Frontend: 1. Click "Verify with Fayda"
    Frontend->>Backend: 2. POST /api/v1/verification/fayda/initiate
    activate Backend

    Backend->>Backend: 3. Check if user already verified
    Backend->>Backend: 4. Generate PKCE (code_verifier, code_challenge)
    Backend->>Backend: 5. Generate state token (CSRF protection)
    Backend->>Backend: 6. Build authorization URL with claims
    Backend->>Backend: 7. Store state & code_verifier in httpOnly signed cookies
    Backend->>Frontend: 8. Return authorization URL + state<br/>{ authorizationUrl, state, expiresIn }
    deactivate Backend

    Frontend->>Fayda: 9. Redirect to Fayda authorization URL
    activate Fayda
    Note over Frontend,Fayda: User authenticates with NIDP<br/>(OTP/Biometrics via mosip:idp:acr)
    Fayda->>Frontend: 10. Redirect with authorization code + state<br/>?code=xxx&state=yyy
    deactivate Fayda

    Frontend->>Backend: 11. POST /api/v1/verification/fayda/callback<br/>{ code, state }
    activate Backend

    Backend->>Backend: 12. Retrieve state & code_verifier from signed cookies
    Backend->>Backend: 13. Validate state token (CSRF check)
    Backend->>Backend: 14. Generate client assertion JWT (RS256)
    Backend->>Fayda: 15. Exchange code for tokens<br/>POST /token<br/>(with client_assertion, code_verifier)
    activate Fayda
    Fayda->>Backend: 16. Return access_token + id_token
    deactivate Fayda

    Backend->>Fayda: 17. GET /userinfo<br/>(Authorization: Bearer access_token)
    activate Fayda
    Fayda->>Backend: 18. Return JWT with user claims
    deactivate Fayda

    Backend->>Backend: 19. Decode userinfo JWT
    Backend->>Backend: 20. Extract: sub, name, birthdate, picture
    Backend->>Database: 21. Check for duplicate Fayda ID
    activate Database
    Database->>Backend: 22. Return existing user or null
    deactivate Database

    alt Duplicate Fayda ID found
        Backend->>Frontend: 23a. Error: Fayda ID already linked
        Note over Backend,Frontend: 409 Conflict
    else No duplicate
        Backend->>Database: 23b. Update user with verified identity
        activate Database
        Note over Backend,Database: Set faydaId, isIdentityVerified,<br/>faydaData, identityVerifiedAt
        Database->>Backend: 24b. User updated
        deactivate Database

        Backend->>Backend: 25. Clear verification cookies
        Backend->>Frontend: 26. Return verification success<br/>{ user, message }
        deactivate Backend
        Frontend->>User: 27. Show verification success
    end
```

---

## Detailed Flow Explanation

### Step 1-2: User Initiates Verification

**Step 1: User Clicks "Verify with Fayda"**

- User must be authenticated (JWT cookie required)
- Frontend React app handles button click
- User must not already be verified

**Step 2: Frontend Requests Authorization URL**

**HTTP Request:**

```http
POST /api/v1/verification/fayda/initiate
Cookie: jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Route Handler** (`verification.routes.ts`):

```typescript
router.post('/fayda/initiate', protect, initiateFaydaVerificationHandler);
```

**Controller** (`verification.controller.ts`):

```typescript
export const initiateFaydaVerificationHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { authorizationUrl, state, codeVerifier } =
      await verificationService.initiateFaydaVerification(userId);

    // Store in httpOnly signed cookies
    res.cookie('fayda_verification_state', state, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: config.isProduction ? 'none' : 'strict',
      maxAge: 10 * 60 * 1000, // 10 minutes
      signed: true,
    });

    res.cookie('fayda_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: config.isProduction ? 'none' : 'strict',
      maxAge: 10 * 60 * 1000,
      signed: true,
    });

    res.status(200).json({
      status: 'success',
      data: { authorizationUrl, state, expiresIn: 600 },
    });
  },
);
```

---

### Step 3-8: Backend Generates PKCE and Authorization URL

**Service - Initiate Verification** (`verification.service.ts`):

```typescript
export const initiateFaydaVerification = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  // Check if already verified
  if (user.isIdentityVerified) {
    throw new AppError(
      'Your identity is already verified. You cannot verify again.',
      400,
    );
  }

  // Generate PKCE parameters
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Generate state token for CSRF protection
  const state = crypto.randomBytes(32).toString('base64url');

  // Build authorization URL with required claims
  const claims = {
    userinfo: {
      name: { essential: true },
      birthdate: { essential: true },
      picture: { essential: true },
      phone_number: { essential: false },
      email: { essential: false },
      gender: { essential: false },
      address: { essential: false },
    },
    id_token: {},
  };

  const authorizationUrl = buildAuthorizationUrl(codeChallenge, state, claims);

  return { authorizationUrl, state, codeVerifier, expiresIn: 600 };
};
```

**PKCE Generation** (`pkce.util.ts`):

```typescript
export const generateCodeVerifier = (): string => {
  const randomBytes = crypto.randomBytes(32);
  return randomBytes.toString('base64url');
};

export const generateCodeChallenge = (verifier: string): string => {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return hash.toString('base64url');
};
```

**Authorization URL Building** (`fayda.util.ts`):

```typescript
export const buildAuthorizationUrl = (
  codeChallenge: string,
  state: string,
  claims?: object,
): string => {
  const params = new URLSearchParams({
    client_id: config.fayda.clientId,
    response_type: 'code',
    redirect_uri: config.fayda.redirectUri,
    scope: 'openid profile email',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    claims_locales: config.fayda.claimsLocales, // "en am"
  });

  if (claims) {
    params.append('claims', JSON.stringify(claims));
  }

  return `${config.fayda.authorizationEndpoint}?${params.toString()}`;
};
```

**HTTP Response:**

```http
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: fayda_verification_state=s:xxx...; HttpOnly; Secure; SameSite=Strict; Max-Age=600
Set-Cookie: fayda_code_verifier=s:yyy...; HttpOnly; Secure; SameSite=Strict; Max-Age=600

{
  "status": "success",
  "data": {
    "authorizationUrl": "https://esignet.authorization.endpoint/authorize?client_id=...&code_challenge=...&state=...",
    "state": "random_state_token_here",
    "expiresIn": 600
  }
}
```

---

### Step 9-10: User Authenticates with Fayda

**Step 9: Frontend Redirects to Fayda**

- Frontend receives authorization URL
- Redirects user to Fayda authorization endpoint
- User sees Fayda/NIDP login screen

**Step 10: User Authenticates**

- User enters phone number or national ID
- Fayda sends OTP to registered phone
- User enters OTP (or uses biometrics if configured)
- User grants consent for data sharing
- Fayda redirects back with authorization code

**Fayda Redirect:**

```
https://yourapp.com/callback?code=4/0AY0e-g7...&state=random_state_token_here
```

**Note:** The actual redirect goes to your frontend, which then sends the code to the backend.

---

### Step 11-14: Backend Processes Callback

**HTTP Request:**

```http
POST /api/v1/verification/fayda/callback
Content-Type: application/json
Cookie: jwt=...; fayda_verification_state=s:xxx...; fayda_code_verifier=s:yyy...

{
  "code": "4/0AY0e-g7xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "state": "random_state_token_here"
}
```

**Route Handler** (`verification.routes.ts`):

```typescript
router.post(
  '/fayda/callback',
  protect,
  validate(faydaCallbackSchema, 'body'),
  handleFaydaCallbackHandler,
);
```

**Validation Schema** (`verification.schema.ts`):

```typescript
export const faydaCallbackSchema = z
  .object({
    code: z.string().min(1, 'Authorization code is required'),
    state: z.string().min(1, 'State token is required'),
  })
  .strict();
```

**Controller - Callback Handler** (`verification.controller.ts`):

```typescript
export const handleFaydaCallbackHandler = catchAsync(
  async (
    req: Request<{}, {}, FaydaCallbackInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const userId = req.user!.id;
    const { code, state } = req.body;

    // Retrieve state and code_verifier from signed cookies
    const storedState = req.signedCookies?.fayda_verification_state;
    const codeVerifier = req.signedCookies?.fayda_code_verifier;

    // Validate state token (CSRF protection)
    if (!storedState || storedState !== state) {
      throw new AppError('Invalid or missing state token.', 401);
    }

    if (!codeVerifier) {
      throw new AppError(
        'Missing code verifier. Please initiate verification again.',
        400,
      );
    }

    // Process callback
    const result = await verificationService.handleFaydaCallback(
      userId,
      code,
      state,
      codeVerifier,
    );

    // Clear cookies after successful verification
    res.clearCookie('fayda_verification_state');
    res.clearCookie('fayda_code_verifier');

    res.status(200).json({
      status: 'success',
      data: result,
    });
  },
);
```

---

### Step 15-16: Exchange Authorization Code for Tokens

**Client Assertion Generation** (`fayda.util.ts`):

```typescript
export const generateClientAssertion = async (): Promise<string> => {
  // Decode Base64-encoded JWK
  const jwkJson = Buffer.from(config.fayda.privateKeyBase64, 'base64').toString(
    'utf8',
  );
  const jwk = JSON.parse(jwkJson);

  // Import JWK as private key
  const privateKey = await importJWK(jwk, 'RS256');

  // Create and sign JWT
  const signedJwt = await new SignJWT({
    iss: config.fayda.clientId, // Issuer
    sub: config.fayda.clientId, // Subject
    aud: config.fayda.tokenEndpoint, // Audience
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(privateKey);

  return signedJwt;
};
```

**Token Exchange** (`fayda.util.ts`):

```typescript
export const exchangeCodeForTokens = async (
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<{ access_token: string; id_token: string }> => {
  // Generate client assertion
  const clientAssertion = await generateClientAssertion();

  // Prepare token request
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: config.fayda.clientId,
    client_assertion: clientAssertion,
    client_assertion_type:
      'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    code_verifier: codeVerifier, // PKCE verification
  });

  // POST to token endpoint (30 second timeout)
  const response = await faydaClient.post(
    config.fayda.tokenEndpoint,
    params.toString(),
  );

  return {
    access_token: response.data.access_token,
    id_token: response.data.id_token,
  };
};
```

**Fayda Token Request:**

```http
POST https://esignet.token.endpoint/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=4/0AY0e-g7...
&redirect_uri=https://yourapp.com/api/v1/verification/fayda/callback
&client_id=your_client_id
&client_assertion=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&code_verifier=original_code_verifier_string
```

**Fayda Token Response:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

### Step 17-18: Retrieve User Information

**UserInfo Request** (`fayda.util.ts`):

```typescript
export const getUserInfo = async (accessToken: string): Promise<string> => {
  const response = await faydaClient.get(config.fayda.userinfoEndpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // Fayda returns userinfo as a JWT string
  return response.data;
};
```

**Fayda UserInfo Request:**

```http
GET https://esignet.userinfo.endpoint/userinfo
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Fayda UserInfo Response:**

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYmlydGhkYXRlIjoiMTk5MC0wMS0wMSIsInBpY3R1cmUiOiJodHRwczovL2V4YW1wbGUuY29tL3Byb2ZpbGUuanBnIn0...
```

---

### Step 19-20: Decode UserInfo JWT

**JWT Decoding** (`fayda.util.ts`):

```typescript
export const decodeUserInfoJWT = (jwt: string): any => {
  // Decode without signature verification (Fayda userinfo JWT)
  const decoded = decodeJwt(jwt);

  const userData: any = {
    sub: decoded.sub,
  };

  // Handle multi-language claims (if claims_locales: "en am" was used)
  if (decoded['name#en'] && decoded['name#am']) {
    userData.nameEn = decoded['name#en'];
    userData.nameAm = decoded['name#am'];
    userData.name = decoded['name#en']; // Default to English
  } else if (decoded.name) {
    userData.name = decoded.name;
  }

  // Copy other fields
  if (decoded.birthdate) userData.birthdate = decoded.birthdate;
  if (decoded.picture) userData.picture = decoded.picture;
  if (decoded.gender) userData.gender = decoded.gender;
  if (decoded.address) userData.address = decoded.address;
  if (decoded.phone_number) userData.phone_number = decoded.phone_number;
  if (decoded.email) userData.email = decoded.email;

  return userData;
};
```

**Decoded UserInfo Structure:**

```typescript
{
  sub: string;              // Fayda subject identifier (unique)
  name?: string;            // Full name (single language)
  nameEn?: string;          // English name (if multi-lang)
  nameAm?: string;          // Amharic name (if multi-lang)
  birthdate?: string;       // Date of birth (YYYY-MM-DD)
  picture?: string;        // Profile photo URL
  gender?: string;         // Gender
  address?: string;        // Address
  phone_number?: string;   // Phone number
  email?: string;          // Email (if available)
}
```

---

### Step 21-24: Security Check and Database Update

**Duplicate Identity Check** (`verification.service.ts`):

```typescript
// Critical security check: Prevent duplicate Fayda ID linking
const existingUser = await User.findOne({
  faydaId: userData.sub,
  _id: { $ne: userId },
});

if (existingUser) {
  logger.warn(
    {
      userId,
      faydaId: userData.sub,
      existingUserId: existingUser._id,
    },
    'Attempted to link Fayda ID already in use',
  );
  throw new AppError(
    'This Fayda ID is already linked to another account.',
    409,
  );
}
```

**Update User with Verified Identity** (`verification.service.ts`):

```typescript
// Update user with verified identity data
user.faydaId = userData.sub;
user.isIdentityVerified = true;
user.identityVerifiedAt = new Date();
user.identityVerificationMethod = 'fayda';
user.faydaData = {
  sub: userData.sub,
  name: userData.name,
  nameEn: userData.nameEn,
  nameAm: userData.nameAm,
  birthdate: userData.birthdate,
  picture: userData.picture,
  gender: userData.gender,
  address: userData.address,
  phone_number: userData.phone_number,
  email: userData.email,
  verifiedAt: new Date(),
};

await user.save();
```

**User Document After Verification:**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "isIdentityVerified": true,
  "identityVerificationMethod": "fayda",
  "identityVerifiedAt": "2025-12-11T10:30:00.000Z",
  "faydaId": "fayda_sub_identifier_12345",
  "faydaData": {
    "sub": "fayda_sub_identifier_12345",
    "name": "John Doe",
    "nameEn": "John Doe",
    "nameAm": "ጆን ዶይ",
    "birthdate": "1990-01-01",
    "picture": "https://fayda.gov.et/profile/photo.jpg",
    "gender": "male",
    "address": "Addis Ababa, Ethiopia",
    "phone_number": "+251911234567",
    "verifiedAt": "2025-12-11T10:30:00.000Z"
  },
  "createdAt": "2025-11-10T12:00:00.000Z",
  "updatedAt": "2025-12-11T10:30:00.000Z"
}
```

---

### Step 25-27: Clear Cookies and Return Success

**Cookie Cleanup** (`verification.controller.ts`):

```typescript
// Clear cookies after successful verification
res.clearCookie('fayda_verification_state', {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: config.isProduction ? 'none' : 'strict',
});
res.clearCookie('fayda_code_verifier', {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: config.isProduction ? 'none' : 'strict',
});
```

**HTTP Response:**

```http
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: fayda_verification_state=; Expires=Thu, 01 Jan 1970 00:00:00 GMT
Set-Cookie: fayda_code_verifier=; Expires=Thu, 01 Jan 1970 00:00:00 GMT

{
  "status": "success",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "isIdentityVerified": true,
      "identityVerificationMethod": "fayda",
      "identityVerifiedAt": "2025-12-11T10:30:00.000Z",
      "faydaId": "fayda_sub_identifier_12345",
      "faydaData": {
        "sub": "fayda_sub_identifier_12345",
        "name": "John Doe",
        "birthdate": "1990-01-01",
        "picture": "https://fayda.gov.et/profile/photo.jpg"
      }
    },
    "message": "Identity verified successfully"
  }
}
```

---

## Error Handling

### Possible Error Scenarios

#### 1. User Already Verified

```json
{
  "status": "error",
  "message": "Your identity is already verified. You cannot verify again."
}
```

**Status Code:** 400  
**Cause:** User has already completed verification

#### 2. Invalid or Missing State Token

```json
{
  "status": "error",
  "message": "Invalid or missing state token."
}
```

**Status Code:** 401  
**Cause:** State token mismatch or expired (CSRF protection)

#### 3. Missing Code Verifier

```json
{
  "status": "error",
  "message": "Missing code verifier. Please initiate verification again."
}
```

**Status Code:** 400  
**Cause:** Cookie expired or not set

#### 4. Invalid Authorization Code

```json
{
  "status": "error",
  "message": "Invalid authorization code or request parameters."
}
```

**Status Code:** 400  
**Cause:** Code expired, already used, or invalid

#### 5. Invalid Client Assertion

```json
{
  "status": "error",
  "message": "Invalid client assertion. Please check your private key configuration."
}
```

**Status Code:** 401  
**Cause:** JWT signature invalid or claims incorrect

#### 6. Invalid Access Token

```json
{
  "status": "error",
  "message": "Invalid or expired access token."
}
```

**Status Code:** 401  
**Cause:** Access token expired or invalid

#### 7. Duplicate Fayda ID

```json
{
  "status": "error",
  "message": "This Fayda ID is already linked to another account."
}
```

**Status Code:** 409  
**Cause:** Security check - one person cannot verify multiple accounts

#### 8. Fayda API Timeout

```json
{
  "status": "error",
  "message": "Failed to exchange authorization code for tokens."
}
```

**Status Code:** 500  
**Cause:** Fayda API timeout (30 second limit exceeded)

---

## Security Features

### 1. PKCE (Proof Key for Code Exchange)

- ✅ **Code Verifier**: 43-128 characters, cryptographically random
- ✅ **Code Challenge**: SHA-256 hash, Base64 URL-safe encoded
- ✅ **Storage**: httpOnly signed cookies (not in database)
- ✅ **Validation**: Verifies code_verifier matches code_challenge during token exchange

### 2. State Token (CSRF Protection)

- ✅ **Generation**: Cryptographically random, 32+ bytes
- ✅ **Storage**: httpOnly signed cookies with 10-minute expiration
- ✅ **Validation**: Must match exactly on callback
- ✅ **One-time use**: Cleared after successful validation

### 3. Client Assertion JWT

- ✅ **Algorithm**: RS256 (RSA with SHA-256)
- ✅ **Claims**: `iss`, `sub`, `aud`, `iat`, `exp`
- ✅ **Expiration**: 2 hours from issuance
- ✅ **Private Key**: Stored securely in environment variable
- ✅ **Validation**: Fayda verifies signature and claims

### 4. Duplicate Identity Prevention

- ✅ **Check**: Prevents one Fayda ID from linking to multiple accounts
- ✅ **Query**: `User.findOne({ faydaId: userData.sub, _id: { $ne: userId } })`
- ✅ **Response**: 409 Conflict if duplicate found
- ✅ **Logging**: Security event logged for audit

### 5. Cookie Security

- ✅ **httpOnly**: Prevents XSS attacks
- ✅ **Secure**: HTTPS only in production
- ✅ **SameSite**: Strict (dev) / None (prod) for cross-origin
- ✅ **Signed**: Uses JWT secret for cookie signing
- ✅ **Expiration**: 10 minutes (automatic cleanup)

### 6. Data Privacy

- ✅ **Sensitive Data**: Stored securely in database
- ✅ **Access Control**: Only authenticated user can view their own verification data
- ✅ **Admin Access**: Admins can view for fraud investigation
- ✅ **No Exposure**: Private key never exposed in logs or responses

---

## Configuration Requirements

### Environment Variables

**Required:**

```env
FAYDA_CLIENT_ID=your_esignet_client_id
FAYDA_AUTHORIZATION_ENDPOINT=https://esignet.authorization.endpoint/authorize
FAYDA_TOKEN_ENDPOINT=https://esignet.token.endpoint/token
FAYDA_USERINFO_ENDPOINT=https://esignet.userinfo.endpoint/userinfo
FAYDA_REDIRECT_URI=https://yourapp.com/api/v1/verification/fayda/callback
FAYDA_PRIVATE_KEY_BASE64=base64_encoded_jwk_private_key
FAYDA_CLAIMS_LOCALES=en am
```

**Configuration** (from `env.config.ts`):

```typescript
fayda: {
  clientId: getEnvVar('FAYDA_CLIENT_ID', true)!,
  authorizationEndpoint: getEnvVar('FAYDA_AUTHORIZATION_ENDPOINT', true)!,
  tokenEndpoint: getEnvVar('FAYDA_TOKEN_ENDPOINT', true)!,
  userinfoEndpoint: getEnvVar('FAYDA_USERINFO_ENDPOINT', true)!,
  redirectUri: getEnvVar('FAYDA_REDIRECT_URI', true)!,
  privateKeyBase64: getEnvVar('FAYDA_PRIVATE_KEY_BASE64', true)!,
  claimsLocales: getEnvVar('FAYDA_CLAIMS_LOCALES', false, 'en am')!,
}
```

**Cookie Parser Setup** (`app.ts`):

```typescript
app.use(cookieParser(config.jwt.secret)); // Use JWT secret for signed cookies
```

---

## Database Schema Updates

### User Document After Fayda Verification

**New Fields Added:**

```typescript
{
  faydaId?: string;                        // Fayda subject ID (unique, sparse index)
  isIdentityVerified: boolean;            // Verification status (default: false)
  identityVerifiedAt?: Date;               // Timestamp of verification
  identityVerificationMethod?: 'fayda' | 'passport' | null;

  faydaData?: {
    sub: string;                           // Fayda subject identifier
    name?: string;                         // Full name
    nameEn?: string;                       // English name (if multi-lang)
    nameAm?: string;                       // Amharic name (if multi-lang)
    birthdate?: string;                    // Date of birth (YYYY-MM-DD)
    picture?: string;                      // Profile photo URL
    gender?: string;                       // Gender
    address?: string;                      // Address
    phone_number?: string;                 // Phone number
    email?: string;                        // Email
    verifiedAt: Date;                     // When data was verified
  };
}
```

**Indexes Added:**

```typescript
userSchema.index({ faydaId: 1 }, { unique: true, sparse: true });
userSchema.index({ isIdentityVerified: 1 });
userSchema.index({ identityVerifiedAt: 1 });
```

---

## Testing the Flow

### Manual Testing Steps

1. **Start Backend:**

```bash
pnpm run dev
```

2. **Configure Frontend:**

- Add "Verify with Fayda" button
- Handle authorization URL redirect
- Send callback code to backend API

3. **Test Scenarios:**

**Scenario A: Successful Verification (New User)**

- User authenticates and initiates verification
- Redirects to Fayda, authenticates with OTP
- Returns with authorization code
- Verify user data updated in database
- Check `isIdentityVerified: true`
- Verify cookies cleared after success

**Scenario B: Already Verified User**

- Attempt to verify already verified user
- Verify 400 error: "Your identity is already verified"

**Scenario C: Duplicate Fayda ID**

- User A verifies with Fayda ID #123
- User B attempts to verify with same Fayda ID #123
- Verify 409 error: "Fayda ID already linked to another account"

**Scenario D: Invalid State Token**

- Initiate verification
- Modify state token in callback request
- Verify 401 error: "Invalid or missing state token"

**Scenario E: Expired Cookies**

- Initiate verification
- Wait 10+ minutes
- Attempt callback
- Verify 400 error: "Missing code verifier"

---

## Integration with Frontend

### Frontend Implementation Example (React)

```typescript
import { useState } from 'react';

function FaydaVerificationButton() {
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    try {
      setLoading(true);

      // Step 1: Initiate verification
      const initiateResponse = await fetch(
        'http://localhost:3000/api/v1/verification/fayda/initiate',
        {
          method: 'POST',
          credentials: 'include', // Important: sends/receives cookies
        }
      );

      const { data } = await initiateResponse.json();
      const { authorizationUrl, state } = data;

      // Step 2: Redirect to Fayda
      window.location.href = authorizationUrl;

      // Note: After user authenticates, Fayda redirects back to your frontend
      // Your frontend callback handler should extract code and state from URL

    } catch (error) {
      console.error('Verification initiation failed:', error);
      setLoading(false);
    }
  };

  // Callback handler (runs after Fayda redirect)
  const handleCallback = async (code: string, state: string) => {
    try {
      setLoading(true);

      const response = await fetch(
        'http://localhost:3000/api/v1/verification/fayda/callback',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ code, state }),
        }
      );

      const result = await response.json();

      if (result.status === 'success') {
        // Update user state
        setUser(result.data.user);
        // Show success message
        alert('Identity verified successfully!');
        // Redirect to dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Verification callback failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleVerify} disabled={loading}>
      {loading ? 'Verifying...' : 'Verify with Fayda'}
    </button>
  );
}
```

**Frontend Callback Route Handler:**

```typescript
// In your React Router callback route
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');

  if (code && state) {
    handleCallback(code, state);
  }
}, []);
```

---

## Comparison: Fayda Verification vs Google OAuth

| Feature                 | Fayda Verification           | Google OAuth      |
| ----------------------- | ---------------------------- | ----------------- |
| **Purpose**             | Identity verification        | Authentication    |
| **Flow**                | OIDC with PKCE               | OAuth 2.0         |
| **Client Auth**         | JWT Client Assertion (RS256) | Client Secret     |
| **State Storage**       | httpOnly signed cookies      | Not required      |
| **PKCE**                | ✅ Required                  | ❌ Optional       |
| **Data Source**         | Government database          | Google profile    |
| **Use Case**            | Verify national ID           | Login/signup      |
| **Verification Status** | ✅ Tracked in database       | ❌ Not applicable |

---

## Best Practices

### 1. Always Validate State Token

Never trust the frontend. Always validate state token from signed cookies to prevent CSRF attacks.

### 2. Secure Private Key Storage

- Store `FAYDA_PRIVATE_KEY_BASE64` in environment variables only
- Never commit to version control
- Rotate keys periodically if compromised

### 3. Handle Multi-Language Claims

Support both single-language and multi-language (name#en, name#am) claim formats.

### 4. Logging for Security

Log all verification attempts for security auditing:

```typescript
logger.info({ userId, faydaId: userData.sub }, 'Fayda verification completed');
logger.warn({ userId, faydaId }, 'Attempted duplicate Fayda ID linking');
```

### 5. Rate Limiting

Apply rate limiting to verification endpoints to prevent abuse:

```typescript
const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
});
```

### 6. HTTPS Required

Always use HTTPS in production for secure cookie transmission and API calls.

### 7. Timeout Configuration

Set generous timeout (30 seconds) for Fayda API calls as government systems can be slow.

---

## Troubleshooting

### Common Issues

**Issue 1: "Invalid or missing state token"**

- **Cause**: State token mismatch, expired cookie, or CSRF attack
- **Solution**: Ensure cookies are being sent with `credentials: 'include'`, check cookie expiration

**Issue 2: "Missing code verifier"**

- **Cause**: Cookie expired (10 minutes) or not set
- **Solution**: Re-initiate verification flow

**Issue 3: "Invalid client assertion"**

- **Cause**: Private key incorrect, JWT claims wrong, or signature invalid
- **Solution**: Verify `FAYDA_PRIVATE_KEY_BASE64` is correct, check JWT claims (iss, sub, aud)

**Issue 4: "Fayda API timeout"**

- **Cause**: Government system slow or network issues
- **Solution**: Timeout is set to 30 seconds, check network connectivity

**Issue 5: "This Fayda ID is already linked to another account"**

- **Cause**: Security check - one person trying to verify multiple accounts
- **Solution**: This is expected behavior, user must use existing account

**Issue 6: Cookies not being set**

- **Cause**: CORS or SameSite policy issues
- **Solution**: Ensure `credentials: 'include'` on frontend, proper CORS config on backend

**Issue 7: "Invalid userinfo: missing subject identifier"**

- **Cause**: Fayda userinfo JWT missing `sub` claim
- **Solution**: Check Fayda response, verify claims configuration

---

## Future Enhancements

1. **License OCR Verification**: Match driver's license with Fayda data (Phase 2)
2. **Passport Verification**: Support visitor flow with passport OCR (Phase 3)
3. **Physical Handover Integration**: Agent app for face verification at pickup (Phase 4)
4. **Verification Status Webhook**: Notify frontend of verification completion
5. **Retry Mechanism**: Automatic retry for transient Fayda API errors
6. **Verification History**: Track verification attempts and outcomes

---

## References

- [Habesha Ride Verification Standard](./README.md#habesha-ride-verification-standard)
- [Identity Verification Implementation Plan](./IDENTITY_VERIFICATION_PLAN.md)
- [OIDC Specification](https://openid.net/specs/openid-connect-core-1_0.html)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
- [Fayda eSignet Documentation](https://docs.fayda.gov.et) (if available)

---

**Version**: 1.0  
**Last Updated**: December 11, 2025  
**Tech Stack**: Node.js, Express, TypeScript, Fayda eSignet OIDC, Mongoose  
**Dependencies**: `jose`, `axios`, `cookie-parser`
