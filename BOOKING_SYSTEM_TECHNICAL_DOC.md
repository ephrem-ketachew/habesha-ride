# Booking System - Technical Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture & Components](#architecture--components)
3. [Data Model](#data-model)
4. [API Endpoints](#api-endpoints)
5. [Business Logic & Workflows](#business-logic--workflows)
6. [Pricing & Calculations](#pricing--calculations)
7. [Status Management](#status-management)
8. [Cancellation System](#cancellation-system)
9. [Mileage Tracking](#mileage-tracking)
10. [Validation & Security](#validation--security)
11. [Database Design](#database-design)
12. [Error Handling](#error-handling)

---

## System Overview

The Booking System is a comprehensive car rental booking management module that handles the complete lifecycle of vehicle rental bookings from creation to completion. It integrates with the RentalListing system and provides automated pricing, availability checking, status management, and cancellation handling.

### Key Features

- **Automated Booking Creation** with instant or manual confirmation
- **Real-time Availability Checking** with overlap detection
- **Dynamic Pricing Calculation** with discounts and fees
- **Status Workflow Management** (pending → confirmed → active → completed)
- **Cancellation System** with policy-based refund calculations
- **Mileage Tracking** with excess mileage fee calculation
- **Odometer Reading Validation** with safety checks
- **Role-based Authorization** (renter vs owner permissions)

---

## Architecture & Components

### Component Structure

```
src/
├── models/
│   └── booking.model.ts          # Mongoose schema & model
├── services/
│   └── booking.service.ts        # Business logic layer
├── controllers/
│   └── booking.controller.ts     # Request handlers
├── routes/
│   └── booking.routes.ts         # API route definitions
├── validation/
│   └── booking.validation.ts     # Zod validation schemas
└── types/
    └── booking.types.ts          # TypeScript type definitions
```

### Request Flow

```
HTTP Request
    ↓
Route Handler (booking.routes.ts)
    ↓
Validation Middleware (Zod schemas)
    ↓
Controller (booking.controller.ts)
    ↓
Service Layer (booking.service.ts)
    ↓
Model Layer (booking.model.ts)
    ↓
MongoDB Database
```

---

## Data Model

### Booking Schema

**Collection**: `bookings`

#### Core Fields

| Field             | Type                          | Required | Description                                 |
| ----------------- | ----------------------------- | -------- | ------------------------------------------- |
| `_id`             | ObjectId                      | Auto     | Primary key                                 |
| `car`             | ObjectId (ref: Car)           | Yes      | Reference to car being rented               |
| `listing`         | ObjectId (ref: RentalListing) | Yes      | Reference to rental listing                 |
| `renter`          | ObjectId (ref: User)          | Yes      | User making the booking                     |
| `owner`           | ObjectId (ref: User)          | Yes      | Car owner                                   |
| `startDate`       | Date                          | Yes      | Booking start date/time                     |
| `endDate`         | Date                          | Yes      | Booking end date/time (must be > startDate) |
| `totalPrice`      | Number                        | Yes      | Total booking price (rounded to 2 decimals) |
| `securityDeposit` | Number                        | Yes      | Security deposit amount                     |

#### Status Fields

| Field                  | Type   | Enum Values                                                            | Default   | Description                      |
| ---------------------- | ------ | ---------------------------------------------------------------------- | --------- | -------------------------------- |
| `status`               | String | `pending`, `confirmed`, `active`, `completed`, `cancelled`, `rejected` | `pending` | Booking lifecycle status         |
| `paymentStatus`        | String | `pending`, `paid`, `refunded`, `failed`                                | `pending` | Payment processing status        |
| `paymentTransactionId` | String | -                                                                      | -         | Payment processor transaction ID |

#### Pricing Breakdown

```typescript
priceBreakdown: {
  basePrice: number;           // ratePerDay × days
  days: number;                // Rental duration in days
  deliveryFee: number;          // Delivery service fee (if requested)
  discountAmount: number;       // Weekly/monthly discount applied
  serviceFee: number;           // 5% of (basePrice - discountAmount)
  excessMileageFee: number;    // Calculated on completion
  cancellationFee?: number;     // Calculated on cancellation
  refundAmount?: number;       // Calculated on cancellation
}
```

#### Usage Limits

```typescript
usageLimits: {
  allowedMileagePerDay: number | null; // null = unlimited
  excessMileageFee: number; // Fee per km over limit
}
```

#### Odometer Readings

```typescript
odometerReadings: {
  start: number | null; // Recorded when booking starts
  end: number | null; // Recorded when booking completes
}
```

#### Cancellation Fields

| Field                | Type   | Description                                              |
| -------------------- | ------ | -------------------------------------------------------- |
| `cancellationPolicy` | String | `flexible`, `moderate`, `strict` (snapshot from listing) |
| `cancellationReason` | String | Optional reason for cancellation                         |
| `cancelledBy`        | String | `renter` or `owner`                                      |
| `cancelledAt`        | Date   | Cancellation timestamp                                   |
| `refundAmount`       | Number | Calculated refund amount                                 |
| `cancellationFee`    | Number | Calculated cancellation fee                              |

---

## API Endpoints

### Base Path: `/api/v1/bookings`

All endpoints require authentication via JWT cookie.

### 1. Create Booking

**POST** `/bookings`

**Request Body:**

```json
{
  "listingId": "507f1f77bcf86cd799439011",
  "startDate": "2024-02-01T10:00:00Z",
  "endDate": "2024-02-05T18:00:00Z",
  "deliveryRequested": false
}
```

**Response:** `201 Created`

```json
{
  "status": "success",
  "data": {
    "booking": {
      /* Booking object */
    }
  }
}
```

**Business Logic:**

- Validates listing exists and is `listed`
- Prevents self-booking (renter ≠ owner)
- Enforces `advanceNoticeHours` requirement
- Validates rental duration (min/max days)
- Checks availability (overlaps + unavailable ranges)
- Calculates pricing with discounts
- Sets status: `confirmed` if instant booking, else `pending`

### 2. Get My Bookings (Renter)

**GET** `/bookings/renter/my-bookings`

**Response:** `200 OK`

```json
{
  "status": "success",
  "results": 5,
  "data": {
    "bookings": [
      /* Array of bookings */
    ]
  }
}
```

**Features:**

- Returns all bookings where user is renter
- Populates car (make, model, photos) and owner info
- Sorted by creation date (newest first)

### 3. Get My Reservations (Owner)

**GET** `/bookings/owner/my-reservations`

**Response:** `200 OK`

```json
{
  "status": "success",
  "results": 8,
  "data": {
    "bookings": [
      /* Array of bookings */
    ]
  }
}
```

**Features:**

- Returns all bookings where user is owner
- Populates car (make, model, photos) and renter info
- Sorted by creation date (newest first)

### 4. Get Booking by ID

**GET** `/bookings/:id`

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "booking": {
      /* Full booking object with populated fields */
    }
  }
}
```

**Authorization:**

- Only renter or owner can view booking
- Returns `403 Forbidden` if unauthorized

### 5. Update Booking Status

**PATCH** `/bookings/:id/status`

**Request Body:**

```json
{
  "status": "confirmed", // or "rejected" or "cancelled"
  "cancellationReason": "Change of plans" // optional, for cancellations
}
```

**Authorization Rules:**

- `confirmed`/`rejected`: Only owner, booking must be `pending`
- `cancelled`: Renter or owner, cannot cancel `active`/`completed`

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "booking": {
      /* Updated booking with refund/cancellation fees */
    }
  }
}
```

### 6. Start Booking (Pickup)

**POST** `/bookings/:id/start`

**Request Body:**

```json
{
  "odometer": 45000
}
```

**Business Logic:**

- Only renter can start booking
- Booking must be `confirmed`
- Can start up to 1 hour before scheduled start date
- Validates odometer reading:
  - Must be ≥ car's current mileage
  - Cannot exceed car mileage by > 100km
- Sets status to `active`
- Records start odometer reading

**Response:** `200 OK`

### 7. Complete Booking (Dropoff)

**POST** `/bookings/:id/complete`

**Request Body:**

```json
{
  "odometer": 45200
}
```

**Business Logic:**

- Renter or owner can complete
- Booking must be `active`
- Start odometer reading must exist
- Validates end odometer:
  - Must be ≥ start reading
  - Average daily mileage ≤ 1000km/day
- Calculates excess mileage fee (if applicable)
- Updates total price with excess mileage fee
- Updates car's mileage to end reading
- Sets status to `completed`

**Response:** `200 OK`

---

## Business Logic & Workflows

### Booking Creation Workflow

```
1. Validate Input
   ├─ Listing exists and is listed
   ├─ Dates are valid (future, endDate > startDate)
   ├─ Renter ≠ Owner (no self-booking)
   └─ Meets advance notice requirement

2. Check Availability
   ├─ Check listing unavailableRanges
   └─ Check overlapping bookings (pending/confirmed/active)

3. Validate Duration
   ├─ Days >= minRentalDurationDays
   └─ Days <= maxRentalDurationDays

4. Calculate Pricing
   ├─ Base price = ratePerDay × days
   ├─ Apply weekly/monthly discount
   ├─ Add delivery fee (if requested)
   ├─ Calculate service fee (5%)
   └─ Total = base - discount + delivery + service

5. Create Booking
   ├─ Status: confirmed (if instantBooking) else pending
   └─ Payment status: pending
```

### Status Transition Workflow

```
pending
  ├─→ confirmed (owner confirms)
  ├─→ rejected (owner rejects)
  └─→ cancelled (renter/owner cancels)

confirmed
  ├─→ active (renter starts with odometer)
  └─→ cancelled (renter/owner cancels)

active
  ├─→ completed (renter/owner completes with odometer)
  └─→ [cannot cancel]

completed
  └─→ [terminal state]

cancelled
  └─→ [terminal state]

rejected
  └─→ [terminal state]
```

### Availability Checking Algorithm

```typescript
function checkAvailability(listingId, startDate, endDate) {
  // 1. Check listing unavailable ranges
  for (range in listing.unavailableRanges) {
    if (startDate < range.endDate && endDate > range.startDate) {
      return false; // Overlaps with unavailable range
    }
  }

  // 2. Check overlapping bookings
  overlappingBooking = Booking.findOne({
    listing: listingId,
    status: { $in: ['pending', 'confirmed', 'active'] },
    startDate: { $lt: endDate },
    endDate: { $gt: startDate },
  });

  return !overlappingBooking;
}
```

**Overlap Detection Formula:**

- Two intervals overlap if: `start1 < end2 && start2 < end1`

---

## Pricing & Calculations

### Base Price Calculation

```typescript
basePrice = Math.round(ratePerDay × days × 100) / 100
```

### Discount Application

```typescript
if (days >= 30 && monthlyDiscountPercent > 0) {
  discountAmount = Math.round(basePrice × (monthlyDiscountPercent / 100) × 100) / 100;
} else if (days >= 7 && weeklyDiscountPercent > 0) {
  discountAmount = Math.round(basePrice × (weeklyDiscountPercent / 100) × 100) / 100;
}
```

### Service Fee

```typescript
serviceFee = Math.round((basePrice - discountAmount) × 0.05 × 100) / 100
```

**Service Fee Percentage:** `5%` (constant: `SERVICE_FEE_PERCENT = 0.05`)

### Delivery Fee

```typescript
if (deliveryRequested && listing.deliveryAvailable) {
  deliveryFee = listing.deliveryFee || 0;
}
```

### Total Price (Initial)

```typescript
totalPrice = Math.round(
  (basePrice - discountAmount + deliveryFee + serviceFee) × 100
) / 100
```

### Excess Mileage Fee (On Completion)

```typescript
if (allowedMileagePerDay !== null && allowedMileagePerDay > 0) {
  allowedMileage = allowedMileagePerDay × rentalDays;
  excessMileage = Math.max(0, totalMileage - allowedMileage);

  if (excessMileage > 0 && excessMileageFee > 0) {
    excessMileageFee = Math.round(excessMileage × excessMileageFee × 100) / 100;
  }
}

// Update total price
totalPrice = basePrice - discountAmount + deliveryFee + serviceFee + excessMileageFee;
```

**All prices are rounded to 2 decimal places** using `Math.round(value × 100) / 100`.

---

## Status Management

### Status Definitions

| Status      | Description                 | Who Can Set  | Conditions                                      |
| ----------- | --------------------------- | ------------ | ----------------------------------------------- |
| `pending`   | Awaiting owner confirmation | System       | Initial state (non-instant bookings)            |
| `confirmed` | Owner confirmed booking     | Owner        | Booking must be `pending`                       |
| `active`    | Trip in progress            | Renter       | Booking must be `confirmed`, odometer recorded  |
| `completed` | Trip finished               | Renter/Owner | Booking must be `active`, end odometer recorded |
| `cancelled` | Booking cancelled           | Renter/Owner | Cannot cancel `active`/`completed`              |
| `rejected`  | Owner rejected request      | Owner        | Booking must be `pending`                       |

### Status Transition Rules

**Valid Transitions:**

- `pending` → `confirmed` (owner only)
- `pending` → `rejected` (owner only)
- `pending` → `cancelled` (renter/owner)
- `confirmed` → `active` (renter only, with odometer)
- `confirmed` → `cancelled` (renter/owner)
- `active` → `completed` (renter/owner, with odometer)

**Invalid Transitions:**

- `active` → `cancelled` (blocked)
- `completed` → `cancelled` (blocked)
- `cancelled` → any (terminal state)
- `rejected` → any (terminal state)
- `completed` → any (terminal state)

---

## Cancellation System

### Cancellation Policies

The system supports three cancellation policies (snapshot from listing at booking creation):

#### 1. Flexible Policy

```typescript
if (hoursUntilTrip >= 24) {
  deductionAmount = 0; // Full refund
} else {
  deductionAmount = ratePerDay; // One day's rate deducted
}
```

#### 2. Moderate Policy

```typescript
if (hoursUntilTrip >= 72) {
  deductionAmount = 0;  // Full refund
} else {
  deductionAmount = baseRefundableAmount × 0.5;  // 50% deducted
}
```

#### 3. Strict Policy

```typescript
if (hoursUntilTrip >= 168) {  // 7 days
  deductionAmount = baseRefundableAmount × 0.5;  // 50% deducted
} else {
  deductionAmount = baseRefundableAmount;  // No refund
}
```

### Cancellation Calculation

```typescript
// Special case: Cancellation within 1 hour of booking
if (hoursSinceBooking <= 1) {
  return {
    refundAmount: totalPrice,
    cancellationFee: 0
  };
}

// Base refundable amount (excludes service fee)
baseRefundableAmount = basePrice - discountAmount + deliveryFee;

// Apply policy-based deduction
deductionAmount = /* calculated based on policy */;

// Calculate refunds
refundFromPrice = baseRefundableAmount - deductionAmount;
totalRefund = refundFromPrice + securityDeposit;
totalFee = deductionAmount + serviceFee;  // Service fee always retained
```

### Owner Cancellation

If owner cancels:

- **Full refund** to renter: `totalPrice + securityDeposit`
- **No cancellation fee**

### Pending Booking Cancellation

If booking is `pending` when cancelled:

- **Full refund**: `totalPrice + securityDeposit`
- **No cancellation fee**

### Payment Status Update

```typescript
if (paymentStatus === 'paid' && refundAmount > 0) {
  paymentStatus = 'refunded';
}
```

---

## Mileage Tracking

### Odometer Reading Validation

#### Start Reading (Pickup)

**Validation Rules:**

1. Must be ≥ car's current mileage
2. Cannot exceed car mileage by > 100km (tolerance for minor discrepancies)
3. Can only be recorded once

**Constants:**

- `MAX_ODOMETER_TOLERANCE_KM = 100`

#### End Reading (Dropoff)

**Validation Rules:**

1. Must be ≥ start reading
2. Average daily mileage ≤ 1000km/day
3. Can only be recorded once

**Constants:**

- `MAX_REASONABLE_DAILY_MILEAGE_KM = 1000`

### Excess Mileage Calculation

```typescript
totalMileage = endOdometer - startOdometer;
rentalDays = calculateDays(startDate, endDate);
averageDailyMileage = totalMileage / rentalDays;

if (averageDailyMileage > MAX_REASONABLE_DAILY_MILEAGE_KM) {
  throw Error('Exceeds reasonable daily limit');
}

if (allowedMileagePerDay !== null && allowedMileagePerDay > 0) {
  allowedMileage = allowedMileagePerDay × rentalDays;
  excessMileage = Math.max(0, totalMileage - allowedMileage);

  if (excessMileage > 0) {
    excessMileageFee = Math.round(excessMileage × excessMileageFee × 100) / 100;
  }
}
```

### Car Mileage Update

On booking completion, the car's mileage is updated:

```typescript
await Car.findByIdAndUpdate(carId, {
  mileage: endOdometerReading,
});
```

---

## Validation & Security

### Input Validation (Zod Schemas)

#### Create Booking Schema

```typescript
{
  listingId: ObjectId (valid MongoDB ObjectId),
  startDate: Date (must be in future),
  endDate: Date (must be after startDate),
  deliveryRequested: boolean (optional)
}
```

#### Odometer Schema

```typescript
{
  odometer: number (min: 0)
}
```

#### Status Update Schema

```typescript
{
  status: enum ['confirmed', 'rejected', 'cancelled'],
  cancellationReason: string (optional)
}
```

### Business Rule Validations

1. **Self-Booking Prevention**

   ```typescript
   if (renterId === ownerId) {
     throw AppError('You cannot book your own car.', 400);
   }
   ```

2. **Advance Notice Requirement**

   ```typescript
   minStartDate = now + (advanceNoticeHours × 60 × 60 × 1000);
   if (startDate < minStartDate) {
     throw AppError(`Must book at least ${advanceNoticeHours} hours in advance.`, 400);
   }
   ```

3. **Rental Duration Limits**

   ```typescript
   if (days < minRentalDurationDays) {
     throw AppError(
       `Minimum rental duration is ${minRentalDurationDays} days.`,
       400,
     );
   }
   if (days > maxRentalDurationDays) {
     throw AppError(
       `Maximum rental duration is ${maxRentalDurationDays} days.`,
       400,
     );
   }
   ```

4. **Date Validation (Model Level)**
   ```typescript
   endDate: {
     validate: {
       validator: function(value) {
         return value > this.startDate;
       },
       message: 'End date must be after start date'
     }
   }
   ```

### Authorization Checks

1. **View Booking**: Only renter or owner
2. **Confirm/Reject**: Only owner, booking must be `pending`
3. **Start Booking**: Only renter, booking must be `confirmed`
4. **Complete Booking**: Renter or owner, booking must be `active`
5. **Cancel Booking**: Renter or owner, cannot cancel `active`/`completed`

---

## Database Design

### Indexes

#### Single Field Indexes

```typescript
bookingSchema.index({ car: 1 });
bookingSchema.index({ renter: 1 });
bookingSchema.index({ owner: 1 });
bookingSchema.index({ status: 1 });
```

#### Compound Indexes

```typescript
// For querying user's bookings by status
bookingSchema.index({ renter: 1, status: 1 });
bookingSchema.index({ owner: 1, status: 1 });

// For availability checking
bookingSchema.index({ car: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ listing: 1, startDate: 1, endDate: 1 });
```

### Relationships

```
Booking
├── car → Car (One-to-One)
├── listing → RentalListing (Many-to-One)
├── renter → User (Many-to-One)
└── owner → User (Many-to-One)
```

### Populated Fields

**For List Queries:**

```typescript
.populate('car', 'make vehicleModel photos year')
.populate('make', 'name')
.populate('vehicleModel', 'name')
.populate('owner', 'firstName lastName profileImage')  // or renter
```

**For Detail Queries:**

```typescript
.populate('car', /* all fields */)
.populate('make', 'name')
.populate('vehicleModel', 'name')
.populate('homeLocation.city', 'name')
.populate('renter', 'firstName lastName email phoneNumber profileImage')
.populate('owner', 'firstName lastName email phoneNumber profileImage')
```

---

## Error Handling

### Error Types

| HTTP Status | Error Type   | Description                                                             |
| ----------- | ------------ | ----------------------------------------------------------------------- |
| `400`       | Bad Request  | Validation errors, invalid status transitions, business rule violations |
| `401`       | Unauthorized | Missing or invalid JWT token                                            |
| `403`       | Forbidden    | Authorization failure (not renter/owner)                                |
| `404`       | Not Found    | Booking, listing, or car not found                                      |
| `409`       | Conflict     | Car not available for selected dates                                    |

### Common Error Scenarios

1. **Availability Conflict**

   ```typescript
   throw new AppError('Car is not available for the selected dates.', 409);
   ```

2. **Invalid Status Transition**

   ```typescript
   throw new AppError(
     `Cannot change status from ${currentStatus} to ${newStatus}.`,
     400,
   );
   ```

3. **Odometer Validation Failure**

   ```typescript
   throw new AppError(
     `Start odometer reading (${reading}km) cannot be less than car's current mileage (${carMileage}km).`,
     400,
   );
   ```

4. **Authorization Failure**
   ```typescript
   throw new AppError('Only the owner can confirm or reject bookings.', 403);
   ```

### Error Response Format

```json
{
  "status": "error",
  "message": "Error message here"
}
```

---

## Technical Constants

### Service Configuration

```typescript
SERVICE_FEE_PERCENT = 0.05; // 5%
MAX_ODOMETER_TOLERANCE_KM = 100;
MAX_REASONABLE_DAILY_MILEAGE_KM = 1000;
```

### Date Calculation

```typescript
function calculateDays(start: Date, end: Date): number {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1; // Minimum 1 day
}
```

---

## Integration Points

### Dependencies

1. **RentalListing Model**
   - Provides pricing, availability, and policy information
   - Fields used: `ratePerDay`, `advanceNoticeHours`, `minRentalDurationDays`, `maxRentalDurationDays`, `instantBookingAvailable`, `cancellationPolicy`, `deliveryAvailable`, `deliveryFee`, `securityDeposit`, `allowedMileagePerDay`, `excessMileageFee`, `weeklyDiscountPercent`, `monthlyDiscountPercent`, `unavailableRanges`

2. **Car Model**
   - Provides vehicle information and current mileage
   - Updated on booking completion with new mileage

3. **User Model**
   - Provides renter and owner information
   - Used for authorization and population

### External Systems (Future)

- **Payment Gateway**: Integration point for `paymentStatus` and `paymentTransactionId`
- **Notification Service**: For booking confirmations, status updates, cancellations
- **Email Service**: For booking confirmations and notifications

---

## Performance Considerations

### Query Optimization

1. **Index Usage**: All queries use indexed fields for optimal performance
2. **Selective Population**: Only necessary fields are populated in list queries
3. **Compound Indexes**: Optimized for common query patterns (user + status, listing + dates)

### Availability Checking

- Uses MongoDB query with indexed fields (`listing`, `status`, `startDate`, `endDate`)
- Single query to check overlaps (no N+1 problem)
- Checks listing unavailable ranges in memory (typically small array)

### Scalability

- Indexes support efficient queries as booking volume grows
- Status-based queries are optimized with compound indexes
- Date range queries use indexed date fields

---

## Testing Considerations

### Key Test Scenarios

1. **Booking Creation**
   - Valid booking creation
   - Self-booking prevention
   - Availability checking
   - Pricing calculation accuracy
   - Instant vs manual confirmation

2. **Status Transitions**
   - Valid transitions
   - Invalid transitions (should fail)
   - Authorization checks

3. **Cancellation**
   - Policy-based refund calculation
   - Owner cancellation (full refund)
   - Pending cancellation (full refund)
   - Timing-based deductions

4. **Mileage Tracking**
   - Odometer validation
   - Excess mileage calculation
   - Car mileage update

5. **Edge Cases**
   - Overlapping bookings
   - Boundary date conditions
   - Maximum/minimum rental durations
   - Zero or negative values

---

## Future Enhancements

### Potential Additions

1. **Payment Integration**: Full payment processing workflow
2. **Automated Status Updates**: Cron jobs for status transitions (e.g., `confirmed` → `active` at start date)
3. **Booking Modifications**: Allow date/price changes before confirmation
4. **Multi-car Bookings**: Support for booking multiple cars in one transaction
5. **Recurring Bookings**: Support for weekly/monthly recurring rentals
6. **Booking Reviews**: Integration with review/rating system
7. **Advanced Analytics**: Booking statistics and reporting

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-XX  
**Maintained By**: Development Team
