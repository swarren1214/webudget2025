import { Response, Request, NextFunction } from 'express';
import { errorHandler } from './error.middleware';
import { UnauthorizedError, ValidationError } from '../utils/errors';

// ✅ Define a custom mock request interface
interface MyMockRequest {
  id: string;
  headers: Record<string, string>;
  path: string;
  method: string;
  log: Partial<Record<keyof Console, jest.Mock>>; // covers error/info/debug/etc
}

function createMockRequest(): MyMockRequest {
  return {
    headers: {},
    path: '/test',
    method: 'GET',
    id: 'test-request-id',
    log: { error: jest.fn() },
  };
}

// ✅ Your custom mock response interface is great!
interface MyMockResponse extends Partial<Response> {
  status: jest.Mock;
  json: jest.Mock;
}

function createMockResponse(): MyMockResponse {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('Error Handler Middleware', () => {
  let req: MyMockRequest;
  let res: MyMockResponse;
  let next: NextFunction;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = jest.fn();

    jest.clearAllMocks();
  });

  it('should handle UnauthorizedError correctly', () => {
    const error = new UnauthorizedError('Invalid token');

    // ✅ Cast only here, where errorHandler expects a full Request
    errorHandler(error, req as unknown as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid token',
        requestId: 'test-request-id',
      },
    });
  });

  it('should handle ValidationError with details', () => {
    const error = new ValidationError('Validation failed', {
      field: 'email',
      reason: 'Invalid format',
    });

    errorHandler(error, req as unknown as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        requestId: 'test-request-id',
        details: {
          field: 'email',
          reason: 'Invalid format',
        },
      },
    });
  });

  it('should handle unknown errors without leaking details', () => {
    const error = new Error('Database connection failed');

    errorHandler(error, req as unknown as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        requestId: 'test-request-id',
      },
    });
  });
});