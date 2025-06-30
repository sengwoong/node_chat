const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('./env'); // 환경 설정 가져오기

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Unified Backend API',
      version: '1.0.0',
      description: '통합된 백엔드 서비스 API 문서 - 채팅, 비디오, RTC, 강의 관리',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}/api`, // 동적 포트 설정
        description: '개발 서버'
      },
      {
        url: 'https://api.example.com/api',
        description: '프로덕션 서버'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: '에러 메시지'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './routes/*.js',
    './chat/*.js',
    './rtc/*.js',
    './video/*.js',
    './lecture/*.js',
    './server.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Unified Backend API Documentation'
  })
}; 