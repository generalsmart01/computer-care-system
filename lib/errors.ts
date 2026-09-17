export class AppError extends Error { constructor(message: string, public statusCode = 500, public code = "INTERNAL_ERROR", public details?: unknown) { super(message); } }
export class ValidationError extends AppError { constructor(message="Invalid input", details?: unknown) { super(message, 400, "VALIDATION_ERROR", details); } }
export class AuthenticationError extends AppError { constructor(message="Authentication required") { super(message, 401, "AUTHENTICATION_ERROR"); } }
export class AuthorizationError extends AppError { constructor(message="You do not have permission") { super(message, 403, "AUTHORIZATION_ERROR"); } }
export class NotFoundError extends AppError { constructor(message="Resource not found") { super(message, 404, "NOT_FOUND"); } }
export class ConflictError extends AppError { constructor(message="Resource already exists") { super(message, 409, "CONFLICT"); } }
export class BusinessRuleError extends AppError { constructor(message: string) { super(message, 422, "BUSINESS_RULE_ERROR"); } }
