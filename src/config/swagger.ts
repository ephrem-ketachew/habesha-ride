import swaggerJsdoc from 'swagger-jsdoc';
import config from './env.config.js';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Kech.ai API v2 MVP',
    version: '1.0.0',
    description:
      'Backend API for Kech.ai - A marketplace platform for car rentals and sales',
    contact: {
      name: 'CCTechEt',
      email: 'support@kech.ai',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Development server',
    },
    {
      url: 'https://kech-backend-v2.onrender.com/api/v1',
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
      name: 'Admin',
      description: 'Admin endpoints for platform management',
    },
  ],
};

const options: swaggerJsdoc.Options = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/models/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

