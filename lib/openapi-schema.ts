/**
 * OpenAPI 3.0 Schema Generator for ENEM Pro API
 * Automatically generated from API route analysis and endpoint documentation
 */

export interface OpenAPISchema {
  openapi: string
  info: {
    title: string
    description: string
    version: string
    contact?: {
      name: string
      email: string
      url: string
    }
    license?: {
      name: string
      url: string
    }
  }
  servers: Array<{
    url: string
    description: string
  }>
  tags: Array<{
    name: string
    description: string
  }>
  paths: Record<string, any>
  components: {
    schemas: Record<string, any>
    securitySchemes: Record<string, any>
    responses?: Record<string, any>
  }
}

export const generateOpenAPISchema = (): OpenAPISchema => {
  return {
    openapi: '3.0.0',
    info: {
      title: 'ENEM Pro API',
      description:
        'Comprehensive API for ENEM exam preparation, question retrieval, AI explanations, and educational features.',
      version: '1.0.0',
      contact: {
        name: 'ENEM Pro Support',
        email: 'api@enem-pro.com',
        url: 'https://enem-pro.com/api/docs',
      },
      license: {
        name: 'Commercial License',
        url: 'https://enem-pro.com/terms',
      },
    },
    servers: [
      {
        url: 'https://enem-pro.com/api',
        description: 'Production API',
      },
      {
        url: 'http://localhost:3000/api',
        description: 'Development API',
      },
    ],
    tags: [
      {
        name: 'Questions',
        description: 'Access ENEM exam questions',
      },
      {
        name: 'Explanations',
        description: 'AI-powered question explanations',
      },
      {
        name: 'Essays',
        description: 'Essay correction and feedback',
      },
      {
        name: 'Simulations',
        description: 'Save and track practice simulations',
      },
      {
        name: 'Health',
        description: 'Health checks and monitoring',
      },
      {
        name: 'Admin',
        description: 'Administrative endpoints (protected)',
      },
      {
        name: 'Webhooks',
        description: 'Webhook events and management',
      },
    ],
    paths: {
      '/questoes': {
        get: {
          tags: ['Questions'],
          summary: 'List ENEM Questions',
          description: 'Retrieve questions with optional filtering by year and discipline',
          operationId: 'listQuestions',
          parameters: [
            {
              name: 'year',
              in: 'query',
              description: 'ENEM exam year (default: 2024)',
              schema: { type: 'integer', example: 2024 },
            },
            {
              name: 'discipline',
              in: 'query',
              description:
                'Filter by discipline (Português, Matemática, História, Geografia, Física, Química, Biologia, Inglês, Espanhol)',
              schema: { type: 'string', example: 'Matemática' },
            },
            {
              name: 'page',
              in: 'query',
              description: 'Pagination page (default: 1)',
              schema: { type: 'integer', example: 1 },
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Results per page (max: 50, default: 20)',
              schema: { type: 'integer', example: 20 },
            },
          ],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of questions retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      questions: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Question' },
                      },
                      total: { type: 'integer' },
                      page: { type: 'integer' },
                      limit: { type: 'integer' },
                      tier_applied: { type: 'boolean' },
                    },
                  },
                },
              },
            },
            '401': {
              $ref: '#/components/responses/Unauthorized',
            },
            '429': {
              $ref: '#/components/responses/TooManyRequests',
            },
            '500': {
              $ref: '#/components/responses/InternalServerError',
            },
          },
        },
      },
      '/questoes/{id}': {
        get: {
          tags: ['Questions'],
          summary: 'Get Single Question',
          description: 'Retrieve detailed information about a specific question',
          operationId: 'getQuestion',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Question ID',
              schema: { type: 'string' },
            },
          ],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Question details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Question' },
                },
              },
            },
            '404': {
              $ref: '#/components/responses/NotFound',
            },
            '500': {
              $ref: '#/components/responses/InternalServerError',
            },
          },
        },
      },
      '/explicar': {
        post: {
          tags: ['Explanations'],
          summary: 'Get AI Explanation',
          description: 'Get AI-powered explanation for a question and selected alternative',
          operationId: 'getExplanation',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['question_id'],
                  properties: {
                    question_id: {
                      type: 'string',
                      example: 'q_2024_001',
                      description: 'The question ID',
                    },
                    selected_alternative: {
                      type: 'string',
                      example: 'A',
                      description: 'Selected answer (A-E)',
                    },
                  },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Explanation generated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      explanation: {
                        type: 'string',
                        description: 'AI-generated explanation',
                      },
                      cached: { type: 'boolean' },
                      cache_source: {
                        type: 'string',
                        enum: ['redis', 'database', 'generated'],
                      },
                      latency_ms: { type: 'integer' },
                    },
                  },
                },
              },
            },
            '400': {
              $ref: '#/components/responses/BadRequest',
            },
            '401': {
              $ref: '#/components/responses/Unauthorized',
            },
            '429': {
              $ref: '#/components/responses/TooManyRequests',
            },
            '500': {
              $ref: '#/components/responses/InternalServerError',
            },
          },
        },
      },
      '/corrigir-redacao': {
        post: {
          tags: ['Essays'],
          summary: 'Correct Essay',
          description: 'Submit an essay for AI-powered correction and feedback',
          operationId: 'correctEssay',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['essay_text'],
                  properties: {
                    essay_text: {
                      type: 'string',
                      description: 'Essay text to correct',
                    },
                    theme: {
                      type: 'string',
                      description: 'Essay theme or topic (optional)',
                    },
                  },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Essay correction completed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      score: { type: 'number', example: 8.5 },
                      feedback: { type: 'string' },
                      suggestions: {
                        type: 'array',
                        items: { type: 'string' },
                      },
                      latency_ms: { type: 'integer' },
                    },
                  },
                },
              },
            },
            '400': {
              $ref: '#/components/responses/BadRequest',
            },
            '429': {
              $ref: '#/components/responses/TooManyRequests',
            },
            '500': {
              $ref: '#/components/responses/InternalServerError',
            },
          },
        },
      },
      '/simulado/salvar': {
        post: {
          tags: ['Simulations'],
          summary: 'Save Simulation',
          description: 'Save a practice simulation result',
          operationId: 'saveSimulation',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['answers'],
                  properties: {
                    answers: {
                      type: 'object',
                      description: 'Map of question_id to selected answer',
                      additionalProperties: { type: 'string' },
                    },
                    simulation_name: {
                      type: 'string',
                      description: 'Optional name for the simulation',
                    },
                  },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Simulation saved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      simulation_id: { type: 'string' },
                      score: { type: 'number' },
                      correct_answers: { type: 'integer' },
                      total_answers: { type: 'integer' },
                    },
                  },
                },
              },
            },
            '401': {
              $ref: '#/components/responses/Unauthorized',
            },
            '500': {
              $ref: '#/components/responses/InternalServerError',
            },
          },
        },
      },
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health Check',
          description: 'Check API health status',
          operationId: 'healthCheck',
          responses: {
            '200': {
              description: 'API is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: {
                        type: 'string',
                        enum: ['healthy', 'degraded', 'unhealthy'],
                      },
                      timestamp: { type: 'string', format: 'date-time' },
                      checks: {
                        type: 'object',
                        additionalProperties: {
                          type: 'object',
                          properties: {
                            status: {
                              type: 'string',
                              enum: ['ok', 'warning', 'error'],
                            },
                            latency_ms: { type: 'integer' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            '503': {
              description: 'API is unhealthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', enum: ['unhealthy'] },
                      error: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/webhook': {
        post: {
          tags: ['Webhooks'],
          summary: 'Webhook Event',
          description: 'Receive webhook events',
          operationId: 'receiveWebhook',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/WebhookPayload' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Webhook received',
            },
            '400': {
              $ref: '#/components/responses/BadRequest',
            },
            '401': {
              $ref: '#/components/responses/Unauthorized',
            },
          },
        },
      },
      '/admin/stats': {
        get: {
          tags: ['Admin'],
          summary: 'Get Admin Stats',
          description: 'Get comprehensive analytics and statistics (admin only)',
          operationId: 'getAdminStats',
          security: [{ bearerAuth: [] }, { apiKey: [] }],
          responses: {
            '200': {
              description: 'Admin statistics',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      total_users: { type: 'integer' },
                      total_questions_answered: { type: 'integer' },
                      cache_hit_rate: { type: 'number' },
                      avg_response_time_ms: { type: 'number' },
                    },
                  },
                },
              },
            },
            '403': {
              $ref: '#/components/responses/Forbidden',
            },
            '500': {
              $ref: '#/components/responses/InternalServerError',
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Question: {
          type: 'object',
          required: ['id', 'text', 'alternatives', 'year', 'discipline'],
          properties: {
            id: {
              type: 'string',
              example: 'q_2024_001',
              description: 'Unique question identifier',
            },
            text: {
              type: 'string',
              description: 'Question text/content',
            },
            alternatives: {
              type: 'array',
              minItems: 2,
              maxItems: 5,
              items: {
                type: 'object',
                properties: {
                  label: {
                    type: 'string',
                    enum: ['A', 'B', 'C', 'D', 'E'],
                  },
                  text: { type: 'string' },
                },
              },
            },
            correct_answer: {
              type: 'string',
              enum: ['A', 'B', 'C', 'D', 'E'],
              description: 'Correct answer letter',
            },
            year: {
              type: 'integer',
              example: 2024,
            },
            discipline: {
              type: 'string',
              example: 'Matemática',
            },
            difficulty: {
              type: 'string',
              enum: ['easy', 'medium', 'hard'],
            },
            explanation: {
              type: 'string',
              description: 'Detailed explanation of the answer',
            },
          },
        },
        WebhookPayload: {
          type: 'object',
          required: ['event', 'timestamp'],
          properties: {
            event: {
              type: 'string',
              enum: [
                'explanation.generated',
                'essay.corrected',
                'simulation.completed',
              ],
              description: 'Type of event',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
            data: {
              type: 'object',
              description: 'Event-specific data',
            },
          },
        },
        Error: {
          type: 'object',
          required: ['error'],
          properties: {
            error: { type: 'string' },
            error_code: { type: 'string' },
            details: { type: 'object' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from authentication endpoint',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key from developer dashboard',
        },
      },
      responses: {
        Unauthorized: {
          description: 'Authentication required or failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        Forbidden: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        BadRequest: {
          description: 'Invalid request parameters',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        TooManyRequests: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string' },
                  tier: { type: 'string' },
                  reset_at: { type: 'string', format: 'date-time' },
                  retry_after_seconds: { type: 'integer' },
                },
              },
            },
          },
        },
        InternalServerError: {
          description: 'Server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
    },
  }
}
