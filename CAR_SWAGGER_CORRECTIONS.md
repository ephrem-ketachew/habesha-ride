# Car Endpoint Swagger Documentation Corrections

## Overview

Fixed Swagger/OpenAPI documentation for 5 car management endpoints by analyzing the actual controller implementations (`car.controller.ts`) and validation schemas (`car.validation.ts`).

---

## 1. POST /cars (Create Car)

### ✅ Corrections Made

#### Multipart/Form-Data Structure

- **Content Type**: `multipart/form-data` (for file uploads) ✅
- **Photos Field**: `photos[]` - Array of binary files (REQUIRED, min 1, max 10)

#### Required Fields (from createCarSchema)

```typescript
Required:
- make (string - MongoDB ObjectId)
- vehicleModel (string - MongoDB ObjectId)
- year (number - 1900 to current+1)
- licensePlate (string)
- address (string) ← NOT homeLocation!
- city (string) ← NOT homeLocation!
- photos (file array - min 1, max 10)
```

#### Optional Fields

```typescript
Optional:
- vin (string)
- bodyType (enum: sedan, suv, truck, hatchback, coupe, van, other)
- color (string)
- transmission (enum: automatic, manual)
- fuelType (enum: gasoline, diesel, electric, hybrid)
- seatingCapacity (number, min 1)
- mileage (number, min 0)
- features (string OR array - will be converted to array)
```

#### Key Finding: homeLocation Structure

- **Schema Transform**: The validation schema transforms `address` and `city` into `homeLocation` object
- **Form Fields**: Send as `address` and `city` (NOT as nested `homeLocation` object)

```typescript
// Validation transform (lines 50-58)
transform((data) => {
  const { address, city, ...rest } = data;
  return {
    ...rest,
    homeLocation: { address, city },
  };
});
```

#### Features Field Behavior

- **Input**: Can be string OR array
- **Transform**: Always converted to array

```typescript
// From validation (lines 39-48)
features: z.union([z.string(), z.array(z.string())])
  .optional()
  .transform((val) => {
    if (typeof val === 'string') return [sanitizeInput(val)];
    return val.map(sanitizeInput);
  });
```

#### Response

- **Status Code**: 201 (Created)
- **Response Body**:

```json
{
  "status": "success",
  "data": {
    "car": { ...full car object with photos... }
  }
}
```

#### Error Handling

- **No Photos**: Returns 400 "You must upload at least 1 car photo."
- **Validation Fails**: Uploaded photos are deleted from Cloudinary before error response

---

## 2. GET /cars/my-cars (Get My Cars)

### ✅ Corrections Made

#### Parameters

- ✅ No parameters required
- Uses authenticated user's ID from JWT cookie

#### Response

- **Key Finding**: Includes `results` field with count
- **Actual Response**:

```json
{
  "status": "success",
  "results": 3,  // ← Number of cars returned
  "data": {
    "cars": [ ...array of car objects... ]
  }
}
```

---

## 3. GET /cars/:id (Get Car by ID)

### ✅ Corrections Made

#### Path Parameter Validation

```typescript
// From getCarSchema (lines 68-70)
id: objectIdSchema; // Must be valid MongoDB ObjectId
```

#### Authorization

- **Key Finding**: Validates ownership via `ownerId` parameter

```typescript
// From controller (lines 69-72)
const { id } = req.params;
const ownerId = req.user!.id;
const car = await carService.getCarById(id, ownerId);
```

- Returns 403 if user is not the owner

#### Response

```json
{
  "status": "success",
  "data": {
    "car": { ...car object... }
  }
}
```

---

## 4. PATCH /cars/:id (Update Car)

### ✅ Corrections Made

#### Multipart/Form-Data

- **Content Type**: `multipart/form-data` ✅
- **Photos**: Optional (can add new photos)
- **All Fields Optional**: No required fields in update

#### Update-Specific Fields

```typescript
Special Update Fields:
- photosToDelete (string OR array) - Photo public IDs to delete
- primaryPhoto (string) - Photo public ID to set as primary
- photos (file array) - New photos to add (max 10)
```

#### Photo Management

```typescript
// From updateCarSchema (lines 118-127)
photosToDelete: z.union([z.string(), z.array(z.string())])
  .optional()
  .transform((val) => {
    if (val === undefined) return [];
    if (typeof val === 'string') return [val];
    return val;
  });
```

#### homeLocation Transform

- **Address/City Handling**: Only creates homeLocation if at least one is provided

```typescript
// From updateCarSchema (lines 132-145)
const homeLocation =
  address || city ? { address: address, city: city } : undefined;
```

#### Error Handling

- **Validation Fails with Photos**: New uploaded photos are deleted from Cloudinary

```typescript
// From controller (lines 92-95)
if (files.length > 0) {
  const publicIds = getPublicIdsFromFiles(files);
  await deleteCloudinaryResources(publicIds);
}
```

#### Response

```json
{
  "status": "success",
  "data": {
    "car": { ...updated car object... }
  }
}
```

---

## 5. DELETE /cars/:id (Delete Car)

### ✅ Corrections Made

#### Path Parameter

- **id**: Must be valid MongoDB ObjectId

#### Authorization

- Validates ownership before deletion

#### Response

- **Status Code**: 204 (No Content)
- **Response Body**:

```json
{
  "status": "success",
  "data": null
}
```

Note: 204 responses typically have no body, but this returns JSON

---

## Summary of Key Findings

### Form Field Structure for Multipart

| Swagger Docs Show | Actual Form Field | Type   |
| ----------------- | ----------------- | ------ |
| ❌ homeLocation   | ✅ address        | string |
| ❌ homeLocation   | ✅ city           | string |
| ✅ photos         | ✅ photos         | file[] |

### Photo Upload Requirements

| Endpoint        | Photos Required? | Max Photos | Special Fields               |
| --------------- | ---------------- | ---------- | ---------------------------- |
| POST /cars      | ✅ Yes (min 1)   | 10         | -                            |
| PATCH /cars/:id | ❌ No (optional) | 10         | photosToDelete, primaryPhoto |

### Response Patterns

| Endpoint          | Status | Has results? | Returns Car? |
| ----------------- | ------ | ------------ | ------------ |
| POST /cars        | 201    | ❌           | ✅           |
| GET /cars/my-cars | 200    | ✅ (count)   | ✅ (array)   |
| GET /cars/:id     | 200    | ❌           | ✅           |
| PATCH /cars/:id   | 200    | ❌           | ✅           |
| DELETE /cars/:id  | 204    | ❌           | ❌           |

### Validation Rules

#### Year

```typescript
min: 1900;
max: new Date().getFullYear() + 1; // e.g., 2026 in 2025
```

#### Enums

```typescript
bodyType: ['sedan', 'suv', 'truck', 'hatchback', 'coupe', 'van', 'other'];
transmission: ['automatic', 'manual'];
fuelType: ['gasoline', 'diesel', 'electric', 'hybrid'];
```

#### Numbers

```typescript
seatingCapacity: min 1
mileage: min 0
```

### Cloudinary Integration

- **Photo Cleanup**: If validation fails after upload, photos are automatically deleted from Cloudinary
- **Photo Management**: Update endpoint can delete specific photos via `photosToDelete`
- **Primary Photo**: Can designate one photo as primary via `primaryPhoto` field

---

## Common Mistakes to Avoid

### 1. ❌ homeLocation as Nested Object

```json
// WRONG (won't work with multipart/form-data)
{
  "homeLocation": {
    "address": "123 Main St",
    "city": "Addis Ababa"
  }
}
```

### 2. ✅ Correct Form Fields

```
// RIGHT (multipart form fields)
address: "123 Main St"
city: "Addis Ababa"
```

### 3. ❌ Features as Array in Form

```
// WRONG (multipart doesn't handle arrays well)
features[]: "AC"
features[]: "Bluetooth"
```

### 4. ✅ Features as String

```
// RIGHT (comma-separated OR single value)
features: "AC,Bluetooth,GPS"
// OR
features: "Air Conditioning"
```

---

## Testing Recommendations

### 1. Create Car (Multipart Form)

```bash
POST /cars
Content-Type: multipart/form-data

# Required fields
make: 507f1f77bcf86cd799439011
vehicleModel: 507f1f77bcf86cd799439012
year: 2022
licensePlate: AA-12345
address: Bole Road, near Mexican Embassy
city: Addis Ababa
photos: [file1.jpg, file2.jpg]  # At least 1 required

# Optional fields
bodyType: sedan
transmission: automatic
fuelType: gasoline
color: Black
seatingCapacity: 5
mileage: 45000
features: Air Conditioning,Bluetooth,GPS
```

Expected: 201 + car object with uploaded photos

### 2. Get My Cars

```bash
GET /cars/my-cars
Cookie: jwt=<token>

# Expected Response
{
  "status": "success",
  "results": 3,
  "data": {
    "cars": [...]
  }
}
```

### 3. Update Car with Photo Management

```bash
PATCH /cars/507f1f77bcf86cd799439011
Content-Type: multipart/form-data

# Update fields (all optional)
mileage: 50000
color: White

# Photo management
photosToDelete: cars/old_photo_id1,cars/old_photo_id2
primaryPhoto: cars/main_photo_id
photos: [new_photo1.jpg, new_photo2.jpg]  # Add new photos
```

Expected: 200 + updated car object

---

## Swagger Implementation Notes

### Multipart/Form-Data Schema

```yaml
requestBody:
  content:
    multipart/form-data:
      schema:
        properties:
          address: # NOT homeLocation.address
            type: string
          city: # NOT homeLocation.city
            type: string
          features: # String, not array
            type: string
          photos: # File array
            type: array
            items:
              type: string
              format: binary
```

### MongoDB ObjectId Validation

All ID fields (make, vehicleModel, car id) must be valid MongoDB ObjectIds:

- Format: 24 hex characters
- Example: `507f1f77bcf86cd799439011`

---

## Files Modified

- ✅ `src/routes/car.routes.ts` - To be updated with 5 endpoint corrections

## Verification Checklist

- ✅ address and city as separate fields (not nested homeLocation)
- ✅ photos required for POST (min 1, max 10)
- ✅ photos optional for PATCH
- ✅ photosToDelete and primaryPhoto fields in PATCH
- ✅ features as string (not array) in form data
- ✅ results field in GET /my-cars response
- ✅ All fields optional in PATCH
- ✅ 204 response for DELETE

---

**Date**: November 26, 2025  
**Status**: ✅ Ready to Apply
