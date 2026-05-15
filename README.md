# Habesha Ride Backend API

## Overview

Habesha Ride is a robust, production-oriented backend API that powers a peer-to-peer vehicle rental and sales marketplace. Built with Node.js, Express, TypeScript, and MongoDB, it implements secure authentication, listing management, booking and sales workflows, verification processes, media handling, and payment integrations.

Designed with clean architecture and scalable business logic, this repository is a portfolio-grade foundation for the Habesha Ride platform.

## Tech Stack

### Core

- **Runtime / Framework:** Node.js & Express
- **Language:** TypeScript
- **Database / ODM:** MongoDB & Mongoose

### Key Libraries & Integrations

- **Authentication:** JWT, bcrypt, Google OAuth 2.0
- **Security & Validation:** Helmet, Rate Limiting, CORS, Zod, DOMPurify
- **Media & Storage:** Cloudinary, Multer
- **Email:** Nodemailer (Brevo / Mailtrap)
- **Logging:** Pino, Morgan

## Key Capabilities

- **Comprehensive Authentication:** register, login, password reset, email verification, and Google SSO
- **Marketplace Management:** CRUD for rental and sale listings with photo upload support
- **Transaction Workflows:** bookings, sale reservations, payment initiation and webhook handling
- **Layered Verification:** resident & visitor identity flows, license validation, handover checks
- **Admin Tooling:** endpoints for moderation, analytics, and platform oversight

## Getting Started

### Prerequisites

- Node.js v18.0.0+
- pnpm v10.19.0+
- MongoDB Atlas account
- Cloudinary account (for media)
- Google Cloud Console project (for OAuth)
- Brevo or Mailtrap account (for transactional emails)

### 1) Install

```bash
git clone https://github.com/yourusername/habesha-ride-backend.git
cd habesha-ride-backend
pnpm install
```

### 2) Environment

Create a `config.env` (or `config.env.example`) in the repo root and populate the values below:

```env
# Server
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
CLIENT_URL=http://localhost:5173

# Database
DATABASE_URL=mongodb+srv://username:<PASSWORD>@cluster.mongodb.net/habesha-ride?retryWrites=true&w=majority
DATABASE_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=90d

# Services (see docs for required keys)
# - Email (Brevo / Mailtrap)
# - Cloudinary
# - Google OAuth
```

Refer to the source files for the complete list of environment variables.

### 3) Database Seeding

Populate reference data (makes/models):

```bash
pnpm run seed
# To remove seeded data:
pnpm run seed:destroy
```

### 4) Run the Server

Development:

```bash
pnpm run dev
```

Production:

```bash
pnpm run build
pnpm start
```

## API Documentation Quick Reference

Base URL: `http://localhost:3000/api/v1`

Core endpoints (examples):

- Auth: `/auth/register`, `/auth/login`, `/auth/google`
- Users: `/user/userProfile`, `/user/updateProfile`
- Vehicles: `/cars` (POST, GET), `/cars/my-cars`, `/cars/:id` (PATCH, DELETE)
- Reference: `/makes`, `/models`

For full request/response schemas and examples, use the OpenAPI/Swagger docs or test with Postman/Insomnia.

## Project Documentation

See the `docs/` directory for detailed documentation:

- System architecture and request lifecycle
- Database ERD
- Verification flows (Fayda, Passport, License)
- Google OAuth flow
- Contribution guidelines

## Roadmap

- Enhanced search and filtering
- Real-time messaging integration
- Expanded automated test coverage
- Full Swagger/OpenAPI documentation

## License & Support

This project is licensed under the ISC License.

For support or to report issues, please open an issue on GitHub or contact support@habesharide.com.

---

Updated README — see [README.md](README.md) for this file.
