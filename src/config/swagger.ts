import swaggerJsdoc from 'swagger-jsdoc';
import config from './env.config.js';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Habesha Ride API v2 MVP',
    version: '1.0.0',
    description:
      'Backend API for Habesha Ride - A marketplace platform for car rentals and sales',
    contact: {
      name: 'CCTechEt',
      email: 'support@habesharide.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Development server',
    },
    {
      url: 'https://habesha-ride-backend-v2.onrender.com/api/v1',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'jwt',
        description: 'JWT token stored in httpOnly cookie',
      },
    },
  },
  security: [],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints',
    },
    {
      name: 'Users',
      description: 'User profile management',
    },
    {
      name: 'Cars',
      description: 'Car management endpoints',
    },
    {
      name: 'Rentals',
      description: 'Rental listing management',
    },
    {
      name: 'Sales',
      description: 'Sale listing management',
    },
    {
      name: 'Makes',
      description: 'Car make (brand) management',
    },
    {
      name: 'Models',
      description: 'Car model management',
    },
    {
      name: 'Cities',
      description: 'City management endpoints',
    },
    {
      name: 'Features',
      description: 'Car feature management endpoints',
    },
    {
      name: 'Admin',
      description: 'Admin endpoints for platform management',
    },
    {
      name: 'Verification',
      description:
        'Identity verification endpoints (Fayda eSignet for locals, Passport verification for foreigners)',
    },
  ],
};

const options: swaggerJsdoc.Options = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/models/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
