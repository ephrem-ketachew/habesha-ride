# Auth Endpoint Swagger Documentation Corrections

## Overview
Fixed Swagger/OpenAPI documentation for 6 authentication endpoints by analyzing the actual controller implementations (`auth.controller.ts`) and validation schemas (`auth.schema.ts`).

---

## 1. POST /auth/register

### ✅ Corrections Made

#### Request Body
- **Field Name Fixed**: `confirmPassword` → `passwordConfirm` (to match validation schema)
- **Phone Number Pattern**: Added regex pattern `^[0-9]{7,15}$` (7-15 digits only, no +/- symbols)
- **Field Descriptions**: Added clarification that firstName/lastName are capitalized and email is lowercased

#### Response
- **Key Finding**: Register does NOT return user object or token
- **Actual Response**: 
  ```json
  {
    "status": "success",
    "message": "Account created. Please check your email to verify your account."
  }
  ```
- **Status Code**: 201 (was already correct)

---

## 2. POST /auth/login

### ✅ Corrections Made

#### Request Body
- ✅ Correct: `email` and `password` (both required)
- Added clarification that email is lowercased

#### Response
- **Key Finding**: Returns user object AND sets JWT cookie
- **Actual Response**:
  ```json
  {
    "status": "success",
    "data": {
      "user": { ...full user object... }
    }
  }
  ```
- **Cookie Details**: 
  - Name: `jwt`
  - HttpOnly: true
  - Secure: true (production)
  - SameSite: 'none' (prod) / 'lax' (dev)
  - Max-Age: 7776000 seconds (90 days)

---

## 3. GET /auth/verify-email

### ✅ Corrections Made

#### Parameters
- ✅ **Confirmed**: Uses QUERY parameters (not request body)
- Parameter: `token` (required)
- Example: `/auth/verify-email?token=a1b2c3d4...`

#### Response
- **Actual Message**: "Email verified successfully. You can now log in."
- No user object or token returned

---

## 4. POST /auth/forgot-password

### ✅ Corrections Made

#### Request Body
- ✅ Correct: Only `email` field (required)

#### Response
- **Security Best Practice**: Always returns success message even if email doesn't exist
- **Actual Message**: "If an account with that email exists, a reset link has been sent."
- This prevents email enumeration attacks

---

## 5. PATCH /auth/reset-password/:token

### ✅ Corrections Made

#### Parameters
- ✅ **Confirmed**: Has BOTH path parameter AND request body
- **Path Parameter**: `token` (the reset token from email)
- **Request Body**: `password` and `passwordConfirm` (both required)

#### Request Body Field Names
- **Corrected**: `confirmPassword` → `passwordConfirm`
- **Password Rules**: Must contain 1 uppercase, 1 lowercase, 1 number, 1 special character

#### Response
- **Actual Message**: "Password reset successfully. You can now log in with your new password."
- No user object or token returned

---

## 6. GET /auth/me

### ✅ Corrections Made

#### Authentication
- ✅ Correct: Requires `cookieAuth` security
- Reads JWT from httpOnly cookie

#### Response
- **Key Finding**: Does NOT return full User schema
- **Actual Response** (specific subset of user fields):
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "id": "507f1f77bcf86cd799439011",
        "email": "john.doe@example.com",
        "role": "user",
        "fullName": "John Doe",
        "profileImage": "https://..."
      }
    }
  }
  ```
- **Changed**: Replaced `$ref: '#/components/schemas/User'` with inline schema showing only these 5 fields

---

## Summary of Key Findings

### Field Naming Issues
1. ❌ `confirmPassword` → ✅ `passwordConfirm` (in register and reset-password)

### Phone Number Validation
- Pattern: `^[0-9]{7,15}$` (digits only, no +/- prefix)
- Example: `"0911234567"` ✅ | `"+251911234567"` ❌

### Response Differences
| Endpoint | Returns User? | Returns Token? | Sets Cookie? |
|----------|---------------|----------------|--------------|
| Register | ❌ | ❌ | ❌ |
| Login | ✅ | ❌ (cookie) | ✅ |
| Verify Email | ❌ | ❌ | ❌ |
| Forgot Password | ❌ | ❌ | ❌ |
| Reset Password | ❌ | ❌ | ❌ |
| Get Me | ✅ (partial) | - | - |

### Security Patterns
1. **Email Enumeration Prevention**: Forgot password always returns success
2. **HttpOnly Cookies**: JWT stored in httpOnly cookie (not accessible via JavaScript)
3. **Password Complexity**: Enforced at validation level (1 upper, 1 lower, 1 number, 1 special)

---

## Validation Rules (from auth.schema.ts)

### Password Requirements
```regex
^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$
```
- Minimum 8 characters
- At least 1 lowercase letter
- At least 1 uppercase letter
- At least 1 digit
- At least 1 special character

### Phone Number Requirements
```regex
^[0-9]{7,15}$
```
- Only digits (no +, -, spaces, or parentheses)
- Between 7 and 15 digits

### Name Requirements
- Minimum 2 characters
- Maximum 50 characters
- Automatically trimmed and capitalized

---

## Testing Recommendations

### 1. Register Flow
```bash
POST /auth/register
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phoneNumber": "0911234567",
  "password": "Password123!",
  "passwordConfirm": "Password123!"
}

# Expected: 201 + message (no user/token)
```

### 2. Login Flow
```bash
POST /auth/login
{
  "email": "john@example.com",
  "password": "Password123!"
}

# Expected: 200 + user object + jwt cookie
```

### 3. Get Current User
```bash
GET /auth/me
Cookie: jwt=<token>

# Expected: 200 + user object (id, email, role, fullName, profileImage only)
```

---

## Files Modified
- ✅ `src/routes/auth.routes.ts` - Updated 6 endpoint documentations

## Verification
- ✅ No linter errors
- ✅ All corrections based on actual controller/validation code
- ✅ Field names match validation schemas
- ✅ Response structures match controller responses
- ✅ Query vs body vs path parameters correctly identified

---

**Date**: November 26, 2025  
**Status**: ✅ Complete and Verified


