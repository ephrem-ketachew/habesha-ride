# Swagger API Documentation

This document provides information about the Swagger/OpenAPI documentation integrated into the Kech.ai API v2 MVP.

## Overview

The API documentation is fully integrated using Swagger/OpenAPI 3.0. It provides an interactive interface to explore and test all API endpoints.

## Accessing the Documentation

### Local Development
When running the application locally, access the Swagger documentation at:

```
http://localhost:3000/api-docs
```

### Production
The production API documentation is available at:

```
https://kech-backend-v2.onrender.com/api-docs
```

## Features

### 1. Interactive API Explorer
- Browse all available endpoints organized by tags
- View request/response schemas
- Test endpoints directly from the browser

### 2. Authentication
The API uses cookie-based authentication with JWT tokens. The Swagger UI is configured to handle the `jwt` cookie automatically.

To authenticate:
1. Use the `/api/v1/auth/login` or `/api/v1/auth/register` endpoint
2. The JWT token will be set as an httpOnly cookie
3. Subsequent requests will automatically include the authentication cookie

### 3. Available API Categories

#### Authentication
- User registration and login
- Email verification
- Password reset and update
- Google OAuth integration
- Session management

#### Users
- User profile management
- Profile updates

#### Cars
- Car listing management (CRUD operations)
- File upload support for car photos
- Car verification status

#### Rentals
- Rental listing creation and management
- Public rental listings with filtering
- Owner-specific rental management

#### Sales
- Sale listing creation and management
- Public sale listings with filtering
- Vehicle condition tracking

#### Makes & Models
- Car brand (make) listing
- Car model listing by make

#### Admin
- User management
- Car verification
- Listing management
- Make and model CRUD operations

## API Base URLs

### Development
```
http://localhost:3000/api/v1
```

### Production
```
https://kech-backend-v2.onrender.com/api/v1
```

## Schema Definitions

All schemas are documented in the Swagger UI and include:
- **User** - User account information
- **Car** - Car details with photos and location
- **RentalListing** - Rental listing with pricing and availability
- **SaleListing** - Sale listing with condition and pricing
- **Make** - Car brand/manufacturer
- **VehicleModel** - Car model under a specific make

## Testing Endpoints

### Using Swagger UI
1. Navigate to the API documentation URL
2. Expand an endpoint to view details
3. Click "Try it out"
4. Fill in required parameters
5. Click "Execute" to send the request
6. View the response below

### Authentication Flow for Testing
1. Register a new account: `POST /api/v1/auth/register`
2. Verify email using the token sent (check logs in development)
3. Login: `POST /api/v1/auth/login`
4. Test protected endpoints (authentication cookie is automatically set)

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "status": "success",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error message here"
}
```

## Request Examples

### Register User
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+251911234567",
  "password": "Password123!",
  "confirmPassword": "Password123!"
}
```

### Create Rental Listing
```bash
POST /api/v1/listings/rent
Content-Type: application/json
Cookie: jwt=<token>

{
  "car": "507f1f77bcf86cd799439011",
  "ratePerDay": 2500,
  "listingDescription": "Well maintained sedan, perfect for city driving",
  "deliveryAvailable": true,
  "deliveryFee": 300
}
```

## File Upload Endpoints

### Create Car with Photos
The car creation endpoint supports multipart/form-data for uploading photos:

```bash
POST /api/v1/cars
Content-Type: multipart/form-data
Cookie: jwt=<token>

- photos: [file1, file2, ...] (1-10 images)
- make: "507f1f77bcf86cd799439011"
- vehicleModel: "507f1f77bcf86cd799439012"
- year: 2022
- ... other fields
```

## Query Parameters

### Pagination
Most list endpoints support pagination:
- `page` (default: 1)
- `limit` (default: 20)

### Filtering
List endpoints support various filters:
- `status` - Filter by status
- `city` - Filter by city
- `make` - Filter by make ID
- `minPrice` / `maxPrice` - Price range filters
- `condition` - Vehicle condition (for sales)

## Security

### Cookie-Based Authentication
- **Type**: API Key
- **Location**: Cookie
- **Name**: `jwt`
- **Description**: JWT token stored in httpOnly cookie

### Best Practices
1. Always use HTTPS in production
2. Tokens expire after 90 days
3. Logout clears the authentication cookie
4. Protected endpoints require valid JWT token

## Development Notes

### Adding New Endpoints
When adding new endpoints, follow this pattern:

```typescript
/**
 * @swagger
 * /api/v1/your-endpoint:
 *   get:
 *     summary: Brief description
 *     tags: [YourTag]
 *     description: Detailed description
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: paramName
 *         schema:
 *           type: string
 *         description: Parameter description
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YourSchema'
 */
router.get('/your-endpoint', yourHandler);
```

### Adding New Schemas
Add schema definitions in model files:

```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     YourSchema:
 *       type: object
 *       required:
 *         - field1
 *         - field2
 *       properties:
 *         field1:
 *           type: string
 *           description: Field description
 */
```

## Configuration

The Swagger configuration is located in `src/config/swagger.ts`. To modify:

1. Update server URLs
2. Add/modify tags
3. Update API information
4. Modify security schemes

## Troubleshooting

### Documentation Not Loading
1. Ensure the server is running
2. Check that swagger dependencies are installed
3. Verify the URL path is `/api-docs`

### Authentication Issues
1. Ensure you're logged in via `/api/v1/auth/login`
2. Check browser cookies for `jwt` token
3. Verify token hasn't expired

### Endpoints Not Appearing
1. Check that JSDoc comments are properly formatted
2. Verify route files are in `src/routes/`
3. Rebuild the project: `pnpm build`

## Support

For issues or questions:
- Check the Swagger UI for detailed endpoint documentation
- Review error responses for specific error messages
- Contact: support@kech.ai

