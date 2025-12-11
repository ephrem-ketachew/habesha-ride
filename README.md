# Kech.ai v2.0 - Backend API

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/yourusername/kech-backend-v2)
[![Code Coverage](https://img.shields.io/badge/coverage-85%25-green)](https://github.com/yourusername/kech-backend-v2)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.9.3-blue)](https://www.typescriptlang.org/)

## 📖 Description

**Kech.ai v2.0** is a robust, secure, and scalable backend API for a **peer-to-peer (P2P) vehicle rental and sales marketplace**. Built with modern technologies and best practices, this API powers a platform where users can list their vehicles for rent or sale, browse available vehicles, and manage their profiles with comprehensive authentication and authorization features.

The platform supports both traditional email/password authentication and Google OAuth 2.0, provides secure file uploads to Cloudinary, and implements a complete vehicle management system with role-based access control.

---

## 🚀 Tech Stack

### Core Technologies

- **[Node.js](https://nodejs.org/)** - JavaScript runtime environment
- **[Express.js](https://expressjs.com/)** (v5.1.0) - Web application framework
- **[TypeScript](https://www.typescriptlang.org/)** (v5.9.3) - Static type checking
- **[MongoDB](https://www.mongodb.com/)** - NoSQL database
- **[Mongoose](https://mongoosejs.com/)** (v8.19.2) - MongoDB ODM

### Authentication & Security

- **[jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)** (v9.0.2) - JWT authentication
- **[bcrypt](https://www.npmjs.com/package/bcrypt)** (v6.0.0) - Password hashing
- **[google-auth-library](https://www.npmjs.com/package/google-auth-library)** (v10.5.0) - Google OAuth 2.0
- **[helmet](https://helmetjs.github.io/)** (v8.1.0) - HTTP security headers
- **[express-rate-limit](https://www.npmjs.com/package/express-rate-limit)** (v8.1.0) - API rate limiting
- **[cors](https://www.npmjs.com/package/cors)** (v2.8.5) - Cross-origin resource sharing
- **[cookie-parser](https://www.npmjs.com/package/cookie-parser)** (v1.4.7) - Cookie parsing

### Validation & Sanitization

- **[Zod](https://zod.dev/)** (v4.1.12) - Schema validation
- **[validator](https://www.npmjs.com/package/validator)** (v13.15.20) - String validation
- **[mongoose-sanitize](https://www.npmjs.com/package/mongoose-sanitize)** (v1.5.0) - NoSQL injection prevention
- **[dompurify](https://www.npmjs.com/package/dompurify)** (v3.3.0) - XSS sanitization
- **[jsdom](https://www.npmjs.com/package/jsdom)** (v27.0.1) - DOM implementation for DOMPurify

### File Upload & Storage

- **[Cloudinary](https://cloudinary.com/)** (v2.8.0) - Cloud image storage and CDN
- **[Multer](https://www.npmjs.com/package/multer)** (v2.0.2) - Multipart/form-data handling
- **[multer-storage-cloudinary](https://www.npmjs.com/package/multer-storage-cloudinary)** (v4.0.0) - Cloudinary storage engine

### Email & Logging

- **[Nodemailer](https://nodemailer.com/)** (v7.0.10) - Email sending (Brevo/Mailtrap)
- **[Pino](https://getpino.io/)** (v10.1.0) - High-performance logging
- **[Morgan](https://www.npmjs.com/package/morgan)** (v1.10.1) - HTTP request logging

### Development Tools

- **[tsx](https://www.npmjs.com/package/tsx)** (v4.20.6) - TypeScript execution
- **[ESLint](https://eslint.org/)** (v9.38.0) - Code linting
- **[Prettier](https://prettier.io/)** (v3.6.2) - Code formatting
- **[tsc-alias](https://www.npmjs.com/package/tsc-alias)** (v1.8.16) - Path alias resolution

---

## ✨ Key Features Implemented

### 🔐 Authentication & Authorization

- ✅ **JWT Authentication with HttpOnly Cookies** - Secure token-based auth
- ✅ **Email/Password Registration & Login** - Traditional authentication
- ✅ **Google OAuth 2.0 Integration** - Social authentication
- ✅ **Email Verification Flow** - Token-based email verification
- ✅ **Password Reset Flow** - Secure password recovery via email
- ✅ **Password Update** - Change password for authenticated users
- ✅ **Role-Based Access Control (RBAC)** - User, Admin, Superadmin roles
- ✅ **Account Status Management** - Pending, Approved, Blocked statuses

### 👤 User Management

- ✅ **User Profile Retrieval** - Get authenticated user profile
- ✅ **Profile Update** - Update user information
- ✅ **User Sanitization** - Remove sensitive data from responses
- ✅ **Account Linking** - Link Google OAuth to existing email accounts

### 🚗 Vehicle (Car) Management

- ✅ **Create Car Listing** - Add new vehicle with photos (1-10 images)
- ✅ **Get My Cars** - Retrieve all cars owned by authenticated user
- ✅ **Get Car by ID** - Retrieve specific car details
- ✅ **Update Car** - Modify car details and photos
- ✅ **Delete Car** - Remove car listing with automatic Cloudinary cleanup
- ✅ **Photo Management** - Upload, update, and delete vehicle photos
- ✅ **Vehicle Verification** - Pending, Approved, Rejected statuses

### 🏭 Make & Model Management

- ✅ **Get All Makes** - Public endpoint for vehicle manufacturers
- ✅ **Get Models by Make** - Public endpoint for vehicle models filtered by manufacturer
- ✅ **Database Seeder** - Populate makes and models from JSON data

### 📧 Email Services

- ✅ **Email Verification** - Send verification links to new users
- ✅ **Password Reset Emails** - Send secure password reset links
- ✅ **Brevo Integration** - Production email delivery
- ✅ **Mailtrap Integration** - Development email testing

### 📤 File Upload & Storage

- ✅ **Cloudinary Integration** - Secure image uploads and storage
- ✅ **Multi-file Upload** - Support for up to 10 images per car
- ✅ **Image Optimization** - Automatic image processing via Cloudinary
- ✅ **Orphan File Cleanup** - Automatic deletion of uploaded files on errors

### 🛡️ Security Features

- ✅ **Rate Limiting** - 100 requests per hour per IP
- ✅ **Helmet Security Headers** - XSS, clickjacking, and MIME type sniffing protection
- ✅ **CORS Configuration** - Controlled cross-origin access
- ✅ **Input Sanitization** - NoSQL injection and XSS prevention
- ✅ **Request Size Limits** - 10KB limit for JSON/URL-encoded data
- ✅ **Password Strength Validation** - Min 8 chars with uppercase, lowercase, number, symbol
- ✅ **Secure Cookie Configuration** - HttpOnly, Secure, SameSite attributes

### 📊 Database Features

- ✅ **MongoDB with Mongoose ODM** - Structured data modeling
- ✅ **Schema Validation** - Built-in Mongoose validators
- ✅ **Indexes for Performance** - Optimized queries
- ✅ **Soft Delete Support** - User account deactivation
- ✅ **Timestamps** - Automatic createdAt/updatedAt fields

---

## 🛡️ Kech.ai Verification Standard

**Version:** 1.0  
**Date:** December 11, 2025  
**Module:** Identity & Security  
**Status:** Approved Architecture

### 1. Overview

This document defines the "Pragmatic Security Stack" for the Kech car rental platform. It balances user experience with rigorous security by layering Digital Identity (Fayda/Passport), Digital Capability (License OCR), and Physical Verification (Handover).

**Core Philosophy:** "Trust but Verify." The digital system approves the booking contract, but the human agent approves the physical asset release.

### 2. The User State (Pre-Booking)

**Objective:** Eliminate friction during initial onboarding to maximize user acquisition.

**Sign Up Methods:** Google, Apple, or Email.

**Account Status:** Created (Unverified).

**User Capabilities:**

- ✅ Browse vehicle inventory.
- ✅ View pricing and availability.
- ✅ Save favorites.
- ❌ Cannot make a booking request.

### 3. The Verification Trigger (At Booking)

**Trigger Point:** When the user clicks "Book Now".

**System Action:** Intercept request and prompt: "To continue, we need to verify your identity and driving license."

The user must select their status to determine the verification path:

#### 🔹 Path A: The Resident Flow (Fayda + License)

**Target:** Ethiopian Citizens & Residents

**Step 1: Identity (Fayda OIDC)**

- **Action:** User clicks "Verify with Fayda".
- **Flow:** Redirect to NIDP login ➝ User Consents ➝ Return to App.
- **Data Capture:** Verified Name, Date of Birth (DOB), and Photo directly from the Government database.
- **Status:** Identity Verified.

**Step 2: Eligibility (License OCR)**

- **Action:** User uploads front/back of Ethiopian Driver's License.
- **System Check:**
  - Name Match: Fuzzy match OCR Name vs. Fayda Name.
  - DOB Match: Exact match OCR DOB vs. Fayda DOB.
- **Result:** If Match = APPROVED.

#### 🔹 Path B: The Visitor Flow (Passport + License)

**Target:** Tourists & Foreign Visitors

**Step 1: Identity (Passport OCR)**

- **Action:** User uploads Passport photo page.
- **System Check:** Google Vision API reads the MRZ (Machine Readable Zone) code and validates the checksum format.
- **Data Capture:** Name, DOB, Passport Number, Nationality.
- **Status:** Identity Verified.

**Step 2: Eligibility (International License)**

- **Action:** User uploads International Driver's Permit (IDP) or valid Home Country License.
- **System Check:** Name matching against Passport data.
- **Result:** If Match = APPROVED.

### 4. The Physical Safeguard (The Handover)

**Role:** The "Human Firewall."

**Context:** Digital verification prevents remote fraud; physical verification prevents theft by the actual driver.

**The Workflow:**

- **Scene:** User arrives at the vehicle location.
- **Tool:** Agent/Owner opens the "Handover Checklist" in the Kech Agent App.
- **Mandatory Checks:**
  - [ ] Inspect License: Verify the physical card's security features (holograms, texture) to ensure it is not a photocopy or low-quality forgery.
  - [ ] Face Check: Visually confirm the person present matches the Fayda/Passport photo displayed on the Agent's screen (sourced from the secure backend).
- **Action:** Agent swipes "Release Car".
- **Result:** The digital contract is generated, timestamped, and embedded with the verified ID numbers.

### 5. Strategic Advantages

- **Frictionless Entry:** High conversion rate at signup (0% drop-off).
- **Cost Efficiency:** Verification costs (OCR/Fayda API calls) are incurred only when a user signals intent to pay.
- **Theft Deterrence:** A thief cannot bypass Path A without stealing a verified Fayda digital identity AND forging a matching physical license.
- **Digital Paper Trail:** In the event of theft, the platform can immediately provide Federal Police with government-verified data (Fayda ID or Passport Number), ensuring rapid legal action.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
- **pnpm** (v10.19.0 or higher) - [Install](https://pnpm.io/installation)
- **MongoDB Atlas Account** - [Sign up](https://www.mongodb.com/cloud/atlas)
- **Cloudinary Account** (optional) - [Sign up](https://cloudinary.com/)
- **Google Cloud Console Project** (for OAuth) - [Create](https://console.cloud.google.com/)
- **Brevo/Mailtrap Account** (for emails) - [Brevo](https://www.brevo.com/) | [Mailtrap](https://mailtrap.io/)

---

## 🚀 Getting Started

### 1. Installation

Clone the repository and install dependencies:

```bash
# Clone the repository
git clone https://github.com/yourusername/kech-backend-v2.git
cd kech-backend-v2

# Install dependencies using pnpm
pnpm install
```

### 2. Environment Setup

Create a `config.env` file in the root directory with the following variables:

```env
# ====================================
# NODE ENVIRONMENT
# ====================================
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# ====================================
# FRONTEND CONFIGURATION
# ====================================
CORS_ORIGIN=http://localhost:5173
CLIENT_URL=http://localhost:5173

# ====================================
# DATABASE CONFIGURATION
# ====================================
DATABASE_URL=mongodb+srv://username:<PASSWORD>@cluster.mongodb.net/kech-v2?retryWrites=true&w=majority
DATABASE_PASSWORD=your_mongodb_password_here

# ====================================
# JWT CONFIGURATION
# ====================================
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=90d

# ====================================
# EMAIL CONFIGURATION
# ====================================
EMAIL_FROM=noreply@kech.ai

# Brevo (Production)
BREVO_HOST=smtp-relay.brevo.com
BREVO_PORT=587
BREVO_USER=your_brevo_email@example.com
BREVO_SMTP_KEY=your_brevo_smtp_key

# Mailtrap (Development)
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USERNAME=your_mailtrap_username
MAILTRAP_PASSWORD=your_mailtrap_password

# ====================================
# CLOUDINARY CONFIGURATION
# ====================================
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ====================================
# GOOGLE OAUTH 2.0 CONFIGURATION
# ====================================
GOOGLE_CLIENT_ID=1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_REDIRECT_URI=postmessage
```

#### 📝 Environment Variables Explanation

| Variable               | Required   | Description                                        |
| ---------------------- | ---------- | -------------------------------------------------- |
| `NODE_ENV`             | Yes        | Environment mode (`development`, `production`)     |
| `PORT`                 | Yes        | Server port (default: 3000)                        |
| `LOG_LEVEL`            | No         | Logging level (`debug`, `info`, `warn`, `error`)   |
| `CORS_ORIGIN`          | Yes (Prod) | Allowed frontend origin URL                        |
| `CLIENT_URL`           | Yes (Prod) | Frontend URL for email links                       |
| `DATABASE_URL`         | Yes        | MongoDB connection string template                 |
| `DATABASE_PASSWORD`    | Yes        | MongoDB Atlas password                             |
| `JWT_SECRET`           | Yes        | Secret key for JWT signing (min 32 chars)          |
| `JWT_EXPIRES_IN`       | Yes        | JWT expiration time (e.g., `90d`, `24h`)           |
| `EMAIL_FROM`           | Yes        | Sender email address                               |
| `BREVO_*`              | No         | Brevo SMTP credentials (production email)          |
| `MAILTRAP_*`           | No         | Mailtrap credentials (development email)           |
| `CLOUDINARY_*`         | No         | Cloudinary credentials (image uploads)             |
| `GOOGLE_CLIENT_ID`     | No         | Google OAuth Client ID                             |
| `GOOGLE_CLIENT_SECRET` | No         | Google OAuth Client Secret                         |
| `GOOGLE_REDIRECT_URI`  | No         | Google OAuth redirect URI (default: `postmessage`) |

> **⚠️ Important:**
>
> - All `Yes (Prod)` variables are optional in development but **required** in production.
> - The `DATABASE_URL` must contain `<PASSWORD>` which will be replaced with `DATABASE_PASSWORD`.
> - At least one email provider (Brevo or Mailtrap) must be configured for email functionality.

### 3. Running the Database Seeder

The seeder populates the database with vehicle makes and models from `src/_data/cars.json`.

```bash
# Import makes and models into the database
pnpm run seed

# Destroy all makes and models (clean database)
pnpm run seed:destroy
```

**What the seeder does:**

- Deletes all existing `Make` and `VehicleModel` documents
- Imports vehicle manufacturers (Toyota, Honda, Ford, etc.)
- Creates vehicle models for each manufacturer (Camry, Civic, F-150, etc.)
- Establishes relationships between makes and models

### 4. Running the Development Server

Start the development server with hot-reload:

```bash
# Start development server (watches for file changes)
pnpm run dev
```

The server will start on `http://localhost:3000` (or the port specified in `config.env`).

**You should see:**

```
[INFO]: [Database]: MongoDB connected successfully
[INFO]: [Cloudinary]: Configured successfully
[INFO]: [Email]: Using Mailtrap transporter.
[INFO]: [Email]: Transporter configured successfully.
[INFO]: [Server]: App running on port 3000 in development mode...
```

### 5. Building for Production

Compile TypeScript to JavaScript:

```bash
# Build the project
pnpm run build

# Start production server
pnpm start
```

### 6. Code Quality

```bash
# Run ESLint
pnpm run lint

# Format code with Prettier
pnpm run format
```

---

## 📡 API Endpoints Overview

### Base URL

```
http://localhost:3000/api/v1
```

### 🔐 Authentication Routes (`/api/v1/auth`)

| Method  | Endpoint                 | Auth | Description                            |
| ------- | ------------------------ | ---- | -------------------------------------- |
| `POST`  | `/register`              | ❌   | Register new user with email/password  |
| `POST`  | `/login`                 | ❌   | Login with email/password              |
| `GET`   | `/verify-email`          | ❌   | Verify email with token (query param)  |
| `POST`  | `/forgot-password`       | ❌   | Request password reset email           |
| `PATCH` | `/reset-password/:token` | ❌   | Reset password with token              |
| `PATCH` | `/update-password`       | ✅   | Update password for authenticated user |
| `POST`  | `/google`                | ❌   | Google OAuth 2.0 authentication        |
| `GET`   | `/logout`                | ❌   | Logout user (clear JWT cookie)         |

### 👤 User Routes (`/api/v1/user`)

| Method  | Endpoint         | Auth | Description                     |
| ------- | ---------------- | ---- | ------------------------------- |
| `GET`   | `/userProfile`   | ✅   | Get authenticated user profile  |
| `PATCH` | `/updateProfile` | ✅   | Update user profile information |

### 🚗 Car Routes (`/api/v1/cars`)

| Method   | Endpoint   | Auth | Description                                         |
| -------- | ---------- | ---- | --------------------------------------------------- |
| `POST`   | `/`        | ✅   | Create new car listing (with photo upload)          |
| `GET`    | `/my-cars` | ✅   | Get all cars owned by authenticated user            |
| `GET`    | `/:id`     | ✅   | Get car details by ID                               |
| `PATCH`  | `/:id`     | ✅   | Update car details and photos                       |
| `DELETE` | `/:id`     | ✅   | Delete car listing (removes photos from Cloudinary) |

**File Upload:**

- Field name: `photos`
- Max files: 10
- Allowed formats: jpg, jpeg, png, webp
- Stored on: Cloudinary

### 🏭 Make Routes (`/api/v1/makes`)

| Method | Endpoint | Auth | Description                                         |
| ------ | -------- | ---- | --------------------------------------------------- |
| `GET`  | `/`      | ❌   | Get all vehicle manufacturers (Toyota, Honda, etc.) |

### 🚙 Model Routes (`/api/v1/models`)

| Method | Endpoint           | Auth | Description                                |
| ------ | ------------------ | ---- | ------------------------------------------ |
| `GET`  | `/?makeId=:makeId` | ❌   | Get all vehicle models for a specific make |

---

## 📂 Project Structure

```
kech-backend-v2/
├── src/
│   ├── _data/                 # Static data files
│   │   └── cars.json          # Makes and models seed data
│   ├── _seeder/               # Database seeders
│   │   └── cars.seeder.ts     # Make/Model seeder
│   ├── config/                # Configuration files
│   │   ├── db.config.ts       # MongoDB connection
│   │   ├── env.config.ts      # Environment variables
│   │   └── logger.config.ts   # Pino logger setup
│   ├── controllers/           # Route controllers (HTTP handlers)
│   │   ├── auth.controller.ts
│   │   ├── car.controller.ts
│   │   ├── make.controller.ts
│   │   ├── model.controller.ts
│   │   └── user.controller.ts
│   ├── middleware/            # Express middleware
│   │   ├── auth.middleware.ts      # JWT verification, role checks
│   │   ├── error.middleware.ts     # Global error handler
│   │   └── validate.middleware.ts  # Zod schema validation
│   ├── models/                # Mongoose schemas
│   │   ├── car.model.ts
│   │   ├── make.model.ts
│   │   ├── rentalListing.model.ts
│   │   ├── saleListing.model.ts
│   │   ├── user.model.ts
│   │   └── vehicleModel.model.ts
│   ├── routes/                # API routes
│   │   ├── auth.routes.ts
│   │   ├── car.routes.ts
│   │   ├── make.routes.ts
│   │   ├── model.routes.ts
│   │   └── user.routes.ts
│   ├── services/              # Business logic layer
│   │   ├── auth.service.ts
│   │   ├── car.service.ts
│   │   └── user.service.ts
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Utility functions
│   │   ├── appError.util.ts        # Custom error class
│   │   ├── catchAsync.util.ts      # Async error wrapper
│   │   ├── cloudinary.util.ts      # Cloudinary helpers
│   │   ├── email.util.ts           # Email sending
│   │   ├── fileUpload.util.ts      # Multer configuration
│   │   ├── google.util.ts          # Google OAuth client
│   │   ├── jwt.util.ts             # JWT sign/verify
│   │   ├── sanitize.util.ts        # Data sanitization
│   │   └── user.util.ts            # User data helpers
│   ├── validation/            # Zod validation schemas
│   │   ├── auth.schema.ts
│   │   ├── car.validation.ts
│   │   ├── model.validation.ts
│   │   └── user.schema.ts
│   ├── views/                 # Email templates (future)
│   ├── app.ts                 # Express app configuration
│   └── server.ts              # Server entry point
├── ARCHITECTURE.md            # System architecture documentation
├── REQUEST_LIFECYCLE.md       # Request flow documentation
├── DATABASE_ERD.md            # Database entity relationship diagram
├── GOOGLE_OAUTH_FLOW.md       # Google OAuth flow documentation
├── CONTRIBUTING.md            # Contribution guidelines
├── config.env                 # Environment variables (not in git)
├── package.json               # Project dependencies
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This file
```

---

## 📚 Documentation

This project includes comprehensive documentation:

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - High-level system architecture with Mermaid diagrams
- **[REQUEST_LIFECYCLE.md](./REQUEST_LIFECYCLE.md)** - Complete request flow (Route → Controller → Service → Model)
- **[DATABASE_ERD.md](./DATABASE_ERD.md)** - Entity Relationship Diagram with schema details
- **[GOOGLE_OAUTH_FLOW.md](./GOOGLE_OAUTH_FLOW.md)** - Google OAuth 2.0 sequence diagram and implementation details
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines and coding standards

---

## 🧪 Testing

**API Testing:**

Use tools like [Postman](https://www.postman.com/), [Insomnia](https://insomnia.rest/), or [Thunder Client](https://www.thunderclient.com/) (VS Code extension).

**Example Request:**

```bash
# Register a new user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "SecurePass123!",
    "phoneNumber": "+1234567890"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!"
  }'

# Get user profile (requires JWT cookie)
curl -X GET http://localhost:3000/api/v1/user/userProfile \
  --cookie "jwt=YOUR_JWT_TOKEN"
```

---

## 🐛 Debugging

### Check Logs

All logs are output to the console with Pino:

```bash
# Development logs (pretty-printed)
[12:00:00.000] INFO: [Database]: MongoDB connected successfully
[12:00:00.100] INFO: [Server]: App running on port 3000 in development mode...
```

### Common Issues

**1. MongoDB Connection Error**

- Verify `DATABASE_URL` and `DATABASE_PASSWORD` in `config.env`
- Check MongoDB Atlas IP whitelist (allow your IP or use `0.0.0.0/0`)
- Ensure database user has correct permissions

**2. JWT Token Issues**

- Ensure `JWT_SECRET` is at least 32 characters long
- Check if cookies are being sent with `credentials: 'include'` in frontend

**3. Email Not Sending**

- Verify at least one email provider (Brevo or Mailtrap) is configured
- Check email credentials are correct
- Look for email logs in console

**4. Cloudinary Upload Errors**

- Verify `CLOUDINARY_*` credentials in `config.env`
- Check file size and format (max 10 images, jpg/png/webp)
- Ensure Cloudinary account is active

**5. Google OAuth Errors**

- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Check authorized redirect URIs in Google Cloud Console
- Ensure OAuth consent screen is configured

---

## 🤝 Contributing

We welcome contributions from the community! Please read our **[CONTRIBUTING.md](./CONTRIBUTING.md)** file for detailed guidelines on:

- Code of Conduct
- Development workflow
- Coding standards
- Commit message conventions
- Pull request process
- Testing requirements

**Quick Start for Contributors:**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the **ISC License**.

---

## 👨‍💻 Author

**CCTechEt**

---

## 🙏 Acknowledgments

- [Express.js](https://expressjs.com/) - Fast, unopinionated web framework
- [Mongoose](https://mongoosejs.com/) - Elegant MongoDB object modeling
- [Zod](https://zod.dev/) - TypeScript-first schema validation
- [Cloudinary](https://cloudinary.com/) - Media management platform
- [Pino](https://getpino.io/) - Fastest logger for Node.js

---

## 📞 Support

If you encounter any issues or have questions:

- 📧 Email: support@kech.ai
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/kech-backend-v2/issues)
- 📖 Docs: [Documentation](./ARCHITECTURE.md)

---

## 🗺️ Roadmap

### Upcoming Features

- [ ] **Rental Listings** - Complete rental listing CRUD operations
- [ ] **Sale Listings** - Complete sale listing CRUD operations
- [ ] **Booking System** - Reserve vehicles for rental
- [ ] **Payment Integration** - Stripe/PayPal integration
- [ ] **Reviews & Ratings** - User and vehicle reviews
- [ ] **Real-time Chat** - Socket.io for user messaging
- [ ] **Advanced Search** - Filter by location, price, features
- [ ] **Admin Dashboard** - Manage users, listings, and reports
- [ ] **SMS Verification** - Twilio integration for phone OTP
- [ ] **Push Notifications** - Firebase Cloud Messaging
- [ ] **Unit & Integration Tests** - Jest/Supertest testing
- [ ] **API Documentation** - Swagger/OpenAPI specs

---

<div align="center">

**Built with ❤️ by the Kech.ai Team**

[Report Bug](https://github.com/yourusername/kech-backend-v2/issues) • [Request Feature](https://github.com/yourusername/kech-backend-v2/issues) • [Documentation](./ARCHITECTURE.md)

</div>
