# WeBudget API Error Handling Guide

## Overview

This document describes the error handling standards and practices for the WeBudget API. All errors follow a consistent format to ensure predictable client behavior and easier debugging.

## Error Response Format

All API errors return a standardized JSON response structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "requestId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "details": {} // Optional field for additional error context
  }
}
```

### Response Fields

- **code**: A machine-readable constant that identifies the error type
- **message**: A human-readable description of the error
- **requestId**: A unique identifier for the request, useful for debugging and support
- **details**: (Optional) Additional structured data about the error, typically used for validation errors

## HTTP Status Codes and Error Types

| Error Code | HTTP Status | Description | Example |
|------------|-------------|-------------|---------|
| `UNAUTHORIZED` | 401 | Authentication required or failed | Missing/invalid JWT token |
| `VALIDATION_ERROR` | 400 | Request validation failed | Missing required fields |
| `NOT_FOUND` | 404 | Resource not found | Institution ID doesn't exist |
| `FORBIDDEN` | 403 | Access denied to resource | Accessing another user's data |
| `CONFLICT` | 409 | Resource state conflict | Duplicate resource creation |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded | Too many API calls |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error | Database connection failure |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable | Maintenance or overload |

## Implementation Guidelines

### For Backend Developers

#### 1. Using Custom Error Classes

```typescript
import { UnauthorizedError, ValidationError, NotFoundError } from '../utils/errors';

// Controller example
export const getInstitution = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { institutionId } = req.params;
        const userId = req.user?.id;
        
        if (!userId) {
            throw new UnauthorizedError('User not authenticated');
        }
        
        const institution = await institutionService.findById(institutionId, userId);
        
        if (!institution) {
            throw new NotFoundError(`Institution with ID '${institutionId}' not found`);
        }
        
        res.json(institution);
    } catch (error) {
        next(error); // Pass to error handler middleware
    }
};
```

#### 2. Validation Errors with Details

```typescript
// When validation fails, provide specific details
throw new ValidationError('Invalid request data', {
    fields: {
        email: 'Invalid email format',
        amount: 'Amount must be greater than 0'
    }
});
```

#### 3. Service Layer Error Handling

```typescript
// Service layer should throw business logic errors
export const linkBankAccount = async (userId: string, publicToken: string) => {
    const existingItemsCount = await plaidRepository.countUserItems(userId);
    
    if (existingItemsCount >= MAX_LINKED_ACCOUNTS) {
        throw new ConflictError(
            `Maximum number of linked accounts (${MAX_LINKED_ACCOUNTS}) reached`
        );
    }
    
    // ... rest of the logic
};
```

### For Frontend Developers

#### 1. Error Response Handling

```typescript
interface ApiError {
    error: {
        code: string;
        message: string;
        requestId: string;
        details?: any;
    };
}

try {
    const response = await fetch('/api/v1/institutions', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!response.ok) {
        const errorData: ApiError = await response.json();
        
        switch (errorData.error.code) {
            case 'UNAUTHORIZED':
                // Redirect to login
                window.location.href = '/login';
                break;
            case 'VALIDATION_ERROR':
                // Show field-specific errors
                showValidationErrors(errorData.error.details);
                break;
            case 'TOO_MANY_REQUESTS':
                // Show rate limit message
                showError('Please wait before trying again');
                break;
            default:
                // Show generic error with request ID
                showError(
                    `${errorData.error.message} (ID: ${errorData.error.requestId})`
                );
        }
    }
} catch (error) {
    // Network or parsing error
    showError('Unable to connect to the server');
}
```

#### 2. Handling Specific Error Scenarios

```typescript
// Handling Plaid relink required
if (institution.syncStatus === 'relink_required') {
    try {
        const { linkToken } = await api.createRelinkToken(institution.id);
        // Launch Plaid Link in update mode
    } catch (error) {
        if (error.code === 'CONFLICT') {
            // Institution doesn't need relinking
            showInfo('This account is already connected');
        }
    }
}

// Handling validation errors
try {
    await api.updateTransaction(transactionId, { notes, categoryId });
} catch (error) {
    if (error.code === 'VALIDATION_ERROR' && error.details) {
        // Show specific field errors
        if (error.details.notes) {
            setNotesError(error.details.notes);
        }
    }
}
```

## Common Error Scenarios

### Authentication Errors

**Scenario**: User's session has expired
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication token has expired",
    "requestId": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
  }
}
```
**Client Action**: Redirect to login page

### Validation Errors

**Scenario**: Invalid request to create link token
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "requestId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "details": {
      "publicToken": "publicToken is required"
    }
  }
}
```
**Client Action**: Display field-specific error messages

### Rate Limiting

**Scenario**: Too many refresh requests
```json
{
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Rate limit exceeded. Please wait 5 minutes before trying again",
    "requestId": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
  }
}
```
**Client Action**: Disable refresh button and show countdown timer

### Business Logic Errors

**Scenario**: Attempting to link too many accounts
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Maximum number of linked accounts (10) reached",
    "requestId": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
  }
}
```
**Client Action**: Show upgrade prompt or account management options

## Best Practices

### 1. Never Expose Internal Details

❌ **Bad**:
```json
{
  "error": {
    "message": "TypeError: Cannot read property 'id' of undefined at UserService.findById (/app/src/services/user.service.ts:45:12)"
  }
}
```

✅ **Good**:
```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred",
    "requestId": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
  }
}
```

### 2. Provide Actionable Error Messages

❌ **Bad**:
```json
{
  "error": {
    "message": "Error"
  }
}
```

✅ **Good**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The start date must be before the end date",
    "details": {
      "startDate": "2025-07-01",
      "endDate": "2025-06-01"
    }
  }
}
```

### 3. Use Consistent Error Codes

- Use SCREAMING_SNAKE_CASE for error codes
- Keep codes generic and reusable
- Don't create overly specific codes like `USER_EMAIL_ALREADY_EXISTS_IN_DATABASE`
- Prefer `CONFLICT` with a descriptive message

### 4. Log Errors Appropriately

- Log full error details server-side, including stack traces
- Include user context (user ID, request path, etc.) in logs
- Never log sensitive data (passwords, tokens, etc.)
- Use request IDs to correlate client reports with server logs

## Testing Error Handling

### Unit Tests

```typescript
describe('InstitutionController', () => {
    it('should return 404 when institution not found', async () => {
        const req = mockRequest({ params: { institutionId: 'invalid-id' } });
        const res = mockResponse();
        const next = jest.fn();
        
        await getInstitution(req, res, next);
        
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                statusCode: 404,
                message: expect.stringContaining('not found')
            })
        );
    });
});
```

### Integration Tests

```typescript
describe('POST /api/v1/plaid/exchange-public-token', () => {
    it('should return 400 when publicToken is missing', async () => {
        const response = await request(app)
            .post('/api/v1/plaid/exchange-public-token')
            .set('Authorization', `Bearer ${validToken}`)
            .send({});
        
        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
            error: {
                code: 'VALIDATION_ERROR',
                message: expect.any(String),
                requestId: expect.any(String)
            }
        });
    });
});
```

## Troubleshooting

### For Support Teams

When users report errors:

1. **Ask for the Request ID**: This is displayed in error messages and can be used to find the exact error in logs
2. **Check the Error Code**: This immediately tells you the category of the problem
3. **Review Recent Changes**: Check if the error started after a recent deployment

### Common Issues and Solutions

| User Report | Likely Error Code | Solution |
|-------------|------------------|----------|
| "I can't see my transactions" | `UNAUTHORIZED` | Session expired, user needs to log in |
| "The app says my bank needs to be reconnected" | `relink_required` status | Guide through Plaid relink flow |
| "I'm getting an error when refreshing" | `TOO_MANY_REQUESTS` | Explain rate limits |
| "Something went wrong" | `INTERNAL_SERVER_ERROR` | Check logs with request ID |

## Migration Guide

### Updating Existing Error Handling

If you're updating existing endpoints to use the new error handling:

1. Replace all `res.status(xxx).json({...})` with appropriate error throws
2. Add `next` parameter to all controller functions
3. Wrap controller logic in try-catch blocks
4. Call `next(error)` in catch blocks
5. Test that errors return the expected format

### Example Migration

**Before**:
```typescript
export const getAccount = async (req: Request, res: Response) => {
    const account = await findAccount(req.params.id);
    if (!account) {
        return res.status(404).json({ message: 'Account not found' });
    }
    res.json(account);
};
```

**After**:
```typescript
export const getAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const account = await findAccount(req.params.id);
        if (!account) {
            throw new NotFoundError('Account not found');
        }
        res.json(account);
    } catch (error) {
        next(error);
    }
};
```

## Questions and Support

For questions about error handling:
- Backend developers: Consult the [Backend Development Guide](./Backend%20Development%20Guide.md)
- Frontend developers: See examples in the API client library
- Support teams: Use the request ID to search logs in the monitoring system
