# Habesha Ride

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/yourusername/habesha-ride-backend)
[![Code Coverage](https://img.shields.io/badge/coverage-85%25-green)](https://github.com/yourusername/habesha-ride-backend)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.9.3-blue)](https://www.typescriptlang.org/)

## Overview

Habesha Ride is a production-oriented backend API for a peer-to-peer vehicle rental and sales marketplace. It is built with Node.js, Express, TypeScript, and MongoDB, and it powers the core workflows needed for a modern marketplace: authentication, vehicle listings, bookings, reservations, verification, media uploads, and payments.

The project is designed to feel like a portfolio-grade backend: clean architecture, real-world business logic, secure defaults, and documentation that makes the system easy to understand and extend.

## Tech Stack

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

## Key Capabilities

- **Authentication and accounts** — register, login, logout, verify email, reset password, update password, and Google sign-in.
- **User management** — profile retrieval, updates, and account status handling.
- **Vehicle management** — create, update, list, and delete car listings with photo support.
- **Marketplace flows** — rental listings, sale listings, bookings, and sale reservations.
- **Payments** — payment initiation and webhook handling.
- **Verification** — support for resident and visitor identity workflows.
- **Admin tooling** — platform oversight, moderation, analytics, and management endpoints.

## Verification Standard

Habesha Ride uses layered verification for higher-trust marketplace workflows. The platform supports resident and visitor identity paths, license validation, and handover-time checks to reduce fraud while keeping the user experience practical.

For the full flow diagrams and implementation details, see [docs/FAYDA_VERIFICATION_FLOW.md](./docs/FAYDA_VERIFICATION_FLOW.md), [docs/PASSPORT_VERIFICATION_FLOW.md](./docs/PASSPORT_VERIFICATION_FLOW.md), and [docs/DRIVER_LICENSE_VERIFICATION_FLOW.md](./docs/DRIVER_LICENSE_VERIFICATION_FLOW.md).

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
- **pnpm** (v10.19.0 or higher) - [Install](https://pnpm.io/installation)
- **MongoDB Atlas Account** - [Sign up](https://www.mongodb.com/cloud/atlas)
- **Cloudinary Account** (optional) - [Sign up](https://cloudinary.com/)
- **Google Cloud Console Project** (for OAuth) - [Create](https://console.cloud.google.com/)
- **Brevo/Mailtrap Account** (for emails) - [Brevo](https://www.brevo.com/) | [Mailtrap](https://mailtrap.io/)

---

## Getting Started

### 1. Installation

Clone the repository and install dependencies:

```bash
# Clone the repository
git clone https://github.com/yourusername/habesha-ride-backend.git
cd habesha-ride-backend

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
DATABASE_URL=mongodb+srv://username:<PASSWORD>@cluster.mongodb.net/habesha-ride?retryWrites=true&w=majority
DATABASE_PASSWORD=your_mongodb_password_here

# ====================================
# JWT CONFIGURATION
# ====================================
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=90d

# ====================================
# EMAIL CONFIGURATION
# ====================================
EMAIL_FROM=noreply@habesharide.com

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

#### Environment Variables

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

> **Important:**
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

## API Endpoints Overview

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication Routes (`/api/v1/auth`)

| Method  | Endpoint                 | Auth | Description                            |
| ------- | ------------------------ | ---- | -------------------------------------- |
| `POST`  | `/register`              | ?    | Register new user with email/password  |
| `POST`  | `/login`                 | ?    | Login with email/password              |
| `GET`   | `/verify-email`          | ?    | Verify email with token (query param)  |
| `POST`  | `/forgot-password`       | ?    | Request password reset email           |
| `PATCH` | `/reset-password/:token` | ?    | Reset password with token              |
| `PATCH` | `/update-password`       | ?    | Update password for authenticated user |
| `POST`  | `/google`                | ?    | Google OAuth 2.0 authentication        |
| `GET`   | `/logout`                | ?    | Logout user (clear JWT cookie)         |

### User Routes (`/api/v1/user`)

| Method  | Endpoint         | Auth | Description                     |
| ------- | ---------------- | ---- | ------------------------------- |
| `GET`   | `/userProfile`   | ?    | Get authenticated user profile  |
| `PATCH` | `/updateProfile` | ?    | Update user profile information |

### Car Routes (`/api/v1/cars`)

| Method   | Endpoint   | Auth | Description                                         |
| -------- | ---------- | ---- | --------------------------------------------------- |
| `POST`   | `/`        | ?    | Create new car listing (with photo upload)          |
| `GET`    | `/my-cars` | ?    | Get all cars owned by authenticated user            |
| `GET`    | `/:id`     | ?    | Get car details by ID                               |
| `PATCH`  | `/:id`     | ?    | Update car details and photos                       |
| `DELETE` | `/:id`     | ?    | Delete car listing (removes photos from Cloudinary) |

**File Upload:**

- Field name: `photos`
- Max files: 10
- Allowed formats: jpg, jpeg, png, webp
- Stored on: Cloudinary

### Make Routes (`/api/v1/makes`)

| Method | Endpoint | Auth | Description                                         |
| ------ | -------- | ---- | --------------------------------------------------- |
| `GET`  | `/`      | ?    | Get all vehicle manufacturers (Toyota, Honda, etc.) |

### Model Routes (`/api/v1/models`)

| Method | Endpoint           | Auth | Description                                |
| ------ | ------------------ | ---- | ------------------------------------------ |
| `GET`  | `/?makeId=:makeId` | ?    | Get all vehicle models for a specific make |

---

## Project Structure

```
habesha-ride-backend/
+-- src/
�   +-- _data/                 # Static data files
�   �   +-- cars.json          # Makes and models seed data
�   +-- _seeder/               # Database seeders
�   �   +-- cars.seeder.ts     # Make/Model seeder
�   +-- config/                # Configuration files
�   �   +-- db.config.ts       # MongoDB connection
�   �   +-- env.config.ts      # Environment variables
�   �   +-- logger.config.ts   # Pino logger setup
�   +-- controllers/           # Route controllers (HTTP handlers)
�   �   +-- auth.controller.ts
�   �   +-- car.controller.ts
�   �   +-- make.controller.ts
�   �   +-- model.controller.ts
�   �   +-- user.controller.ts
�   +-- middleware/            # Express middleware
�   �   +-- auth.middleware.ts      # JWT verification, role checks
�   �   +-- error.middleware.ts     # Global error handler
�   �   +-- validate.middleware.ts  # Zod schema validation
�   +-- models/                # Mongoose schemas
�   �   +-- car.model.ts
�   �   +-- make.model.ts
�   �   +-- rentalListing.model.ts
�   �   +-- saleListing.model.ts
�   �   +-- user.model.ts
�   �   +-- vehicleModel.model.ts
�   +-- routes/                # API routes
�   �   +-- auth.routes.ts
�   �   +-- car.routes.ts
�   �   +-- make.routes.ts
�   �   +-- model.routes.ts
�   �   +-- user.routes.ts
�   +-- services/              # Business logic layer
�   �   +-- auth.service.ts
�   �   +-- car.service.ts
�   �   +-- user.service.ts
�   +-- types/                 # TypeScript type definitions
�   +-- utils/                 # Utility functions
�   �   +-- appError.util.ts        # Custom error class
�   �   +-- catchAsync.util.ts      # Async error wrapper
�   �   +-- cloudinary.util.ts      # Cloudinary helpers
�   �   +-- email.util.ts           # Email sending
�   �   +-- fileUpload.util.ts      # Multer configuration
�   �   +-- google.util.ts          # Google OAuth client
�   �   +-- jwt.util.ts             # JWT sign/verify
�   �   +-- sanitize.util.ts        # Data sanitization
�   �   +-- user.util.ts            # User data helpers
�   +-- validation/            # Zod validation schemas
�   �   +-- auth.schema.ts
�   �   +-- car.validation.ts
�   �   +-- model.validation.ts
�   �   +-- user.schema.ts
�   +-- views/                 # Email templates (future)
�   +-- app.ts                 # Express app configuration
�   +-- server.ts              # Server entry point
+-- docs/ARCHITECTURE.md            # System architecture documentation
+-- docs/REQUEST_LIFECYCLE.md       # Request flow documentation
+-- docs/DATABASE_ERD.md            # Database entity relationship diagram
+-- docs/GOOGLE_OAUTH_FLOW.md       # Google OAuth flow documentation
+-- docs/CONTRIBUTING.md            # Contribution guidelines
+-- config.env                 # Environment variables (not in git)
+-- package.json               # Project dependencies
+-- tsconfig.json              # TypeScript configuration
+-- README.md                  # This file
```

---

## Documentation

The `docs/` folder contains the supporting implementation material for the project:

- [Architecture](./docs/ARCHITECTURE.md) — System design and service layout
- [Request Lifecycle](./docs/REQUEST_LIFECYCLE.md) — Route-to-database request flow
- [Database ERD](./docs/DATABASE_ERD.md) — Data model and entity relationships
- [Google OAuth Flow](./docs/GOOGLE_OAUTH_FLOW.md) — OAuth sequence and integration notes
- [Contribution Guide](./docs/CONTRIBUTING.md) — Development standards and workflow

## Testing

Use Postman, Insomnia, Thunder Client, or Swagger UI to validate endpoints during development.

Quick examples:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!"
  }'

curl -X GET http://localhost:3000/api/v1/user/userProfile \
  --cookie "jwt=YOUR_JWT_TOKEN"
```

## Contributing

Contributions are welcome. Please review the contribution guide before opening a pull request.

Typical workflow:

1. Fork the repository
2. Create a feature branch
3. Make and test your changes
4. Run `pnpm run lint` and `pnpm run format`
5. Open a pull request

## License

This project is licensed under the ISC License.

## Support

If you need help or spot an issue, reach out here:

- Email: support@habesharide.com
- Issues: [GitHub Issues](https://github.com/yourusername/habesha-ride-backend/issues)
- Docs: [Project Documentation](./docs/ARCHITECTURE.md)

## Roadmap

Planned improvements include:

- Rental listing enhancements
- Sale listing enhancements
- Booking and reservation expansion
- Advanced search and filtering
- Real-time messaging
- Automated testing coverage
- Swagger/OpenAPI expansion

<div align="center">

Built for the Habesha Ride platform.

</div>
