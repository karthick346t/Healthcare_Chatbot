import swaggerJSDoc from 'swagger-jsdoc';
import config from './config';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Healthcare Chatbot API',
    version: '1.0.0',
    description: 'API documentation for the Healthcare Chatbot backend',
  },
  servers: [
    {
      url: `http://localhost:${config.PORT}`,
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: ['./src/routes/*.ts', './src/models/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
