# Quick Start - Swagger Documentation

## 🚀 Test Your New Swagger Docs

### 1. Start the Development Server

```bash
pnpm dev
```

### 2. Open Your Browser

Navigate to:

```
http://localhost:3000/api-docs
```

### 3. What You'll See

- **Interactive API Documentation** with all your endpoints
- **8 API Categories**: Authentication, Users, Cars, Rentals, Sales, Makes, Models, Admin
- **Try It Out** buttons to test endpoints directly
- **Schema Definitions** for all data models

## 🔐 Test Authentication Flow

### Step 1: Register a User

1. Find `POST /auth/register` under **Authentication**
2. Click "Try it out"
3. Use this sample data:

```json
{
  "firstName": "Test",
  "lastName": "User",
  "email": "test@example.com",
  "phoneNumber": "+251911234567",
  "password": "Test123!@#",
  "confirmPassword": "Test123!@#"
}
```

4. Click "Execute"

### Step 2: Check Email Verification (Dev Mode)

- In development, check your console logs for the verification token
- Or skip to login if email verification is optional

### Step 3: Login

1. Find `POST /auth/login`
2. Try it out with:

```json
{
  "email": "test@example.com",
  "password": "Test123!@#"
}
```

3. JWT cookie will be automatically set!

### Step 4: Test Protected Endpoints

- Now you can test any endpoint with the 🔒 lock icon
- The authentication cookie is automatically included

## 📝 Test Creating Listings

### Create a Rental Listing

Navigate to `POST /listings/rent` and use:

```json
{
  "car": "YOUR_CAR_ID",
  "ratePerDay": 2500,
  "ratePerHour": 150,
  "deliveryAvailable": true,
  "deliveryFee": 300,
  "minRentalDurationDays": 1,
  "listingDescription": "Well maintained sedan, perfect for city driving with excellent fuel economy"
}
```

## 🎯 Key Features to Explore

### 1. Filter & Pagination

Try the query parameters on:

- `GET /listings/rent`
- `GET /listings/sale`

Example filters:

- `?page=1&limit=10`
- `?city=Addis Ababa`
- `?minPrice=1000&maxPrice=5000`

### 2. File Uploads

Test `POST /cars` with multipart/form-data:

- Upload 1-10 car photos
- Include all required car details

### 3. Search Makes & Models

- `GET /makes` - Get all car brands
- `GET /models?make=MAKE_ID` - Get models for a specific make

## 📊 API Statistics

- **Total Documented Endpoints**: 30+
- **Authentication Endpoints**: 9
- **CRUD Operations**: Fully documented
- **File Upload Support**: ✅
- **Query Parameters**: ✅
- **Response Examples**: ✅

## 🔧 Troubleshooting

### Can't see the docs?

```bash
# Make sure server is running
pnpm dev

# Check the URL
http://localhost:3000/api-docs
```

### Authentication not working?

1. Make sure you logged in via `/auth/login`
2. Check browser dev tools → Application → Cookies
3. Look for `jwt` cookie

### Endpoints showing errors?

- Check that your MongoDB is running
- Verify environment variables are set
- Look at server console for detailed errors

## 📚 Full Documentation

- **Complete Guide**: See `SWAGGER_DOCS.md`
- **Implementation Details**: See `SWAGGER_DOCS.md`

## 🎉 Success Indicators

✅ Swagger UI loads at `/api-docs`  
✅ All endpoints are visible and organized  
✅ Can login and authentication cookie is set  
✅ Protected endpoints work after login  
✅ Response schemas are displayed correctly

---

**Ready to test?** Run `pnpm dev` and visit `http://localhost:3000/api-docs`!
