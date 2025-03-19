export class AppError extends Error {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly context: Record<string, any>;

    constructor(
        message: string,
        {
            code = 'INTERNAL_ERROR',
            statusCode = 500,
            isOperational = true,
            context = {},
        }: {
            code?: string;
            statusCode?: number;
            isOperational?: boolean;
            context?: Record<string, any>;
        } = {}
    ) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.context = context;

        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    public readonly validationErrors: Record<string, string[]>;

    constructor(
        message: string,
        validationErrors: Record<string, string[]> = {},
        context: Record<string, any> = {}
    ) {
        super(message, {
            code: 'VALIDATION_ERROR',
            statusCode: 400,
            isOperational: true,
            context,
        });
        this.validationErrors = validationErrors;
    }
}

export class NotFoundError extends AppError {
    constructor(
        entity: string,
        identifier?: string | number,
        context: Record<string, any> = {}
    ) {
        const message = identifier
            ? `${entity} with identifier ${identifier} not found`
            : `${entity} not found`;

        super(message, {
            code: 'NOT_FOUND',
            statusCode: 404,
            isOperational: true,
            context: { entity, identifier, ...context },
        });
    }
}

export class UnauthorizedError extends AppError {
    constructor(
        message = 'Authentication required',
        context: Record<string, any> = {}
    ) {
        super(message, {
            code: 'UNAUTHORIZED',
            statusCode: 401,
            isOperational: true,
            context,
        });
    }
}

export class ForbiddenError extends AppError {
    constructor(
        message = 'You do not have permission to perform this action',
        context: Record<string, any> = {}
    ) {
        super(message, {
            code: 'FORBIDDEN',
            statusCode: 403,
            isOperational: true,
            context,
        });
    }
}

export class ConflictError extends AppError {
    constructor(
        message: string,
        context: Record<string, any> = {}
    ) {
        super(message, {
            code: 'CONFLICT',
            statusCode: 409,
            isOperational: true,
            context,
        });
    }
}


export class ExternalApiError extends AppError {
    public readonly apiName: string;

    public readonly externalCode?: string | number;

    public readonly rawError?: any;

    constructor(
        apiName: string,
        message: string,
        {
            externalCode,
            rawError,
            context = {},
        }: {
            externalCode?: string | number;
            rawError?: any;
            context?: Record<string, any>;
        } = {}
    ) {
        super(`${apiName} API error: ${message}`, {
            code: 'EXTERNAL_API_ERROR',
            statusCode: 502, // Bad Gateway
            isOperational: true,
            context: { apiName, externalCode, ...context },
        });

        this.apiName = apiName;
        this.externalCode = externalCode;
        this.rawError = rawError;
    }
}


export class DatabaseError extends AppError {
    constructor(
        message: string,
        originalError?: Error,
        context: Record<string, any> = {}
    ) {
        super(message, {
            code: 'DATABASE_ERROR',
            statusCode: 500,
            isOperational: true,
            context: {
                ...context,
                originalError: originalError ? {
                    message: originalError.message,
                    name: originalError.name,
                } : undefined,
            },
        });
    }
}

export class TimeoutError extends AppError {
    constructor(
        operation: string,
        timeoutMs: number,
        context: Record<string, any> = {}
    ) {
        super(`Operation '${operation}' timed out after ${timeoutMs}ms`, {
            code: 'TIMEOUT',
            statusCode: 504, // Gateway Timeout
            isOperational: true,
            context: { operation, timeoutMs, ...context },
        });
    }
}

export class RateLimitError extends AppError {
    constructor(
        message = 'Rate limit exceeded',
        context: Record<string, any> = {}
    ) {
        super(message, {
            code: 'RATE_LIMIT',
            statusCode: 429,
            isOperational: true,
            context,
        });
    }
}

export class SyncError extends AppError {
    constructor(
        message: string,
        source: string,
        context: Record<string, any> = {}
    ) {
        super(message, {
            code: 'SYNC_ERROR',
            statusCode: 500,
            isOperational: true,
            context: { source, ...context },
        });
    }
}