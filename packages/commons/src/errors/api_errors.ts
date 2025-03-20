import { errorCodes } from "./error_codes";

export class ApiError extends Error {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly context: Record<string, any>;

    constructor(
        message: string,
        {
            code = "INTERNAL_SERVER_ERROR",
            statusCode = errorCodes.api.INTERNAL_SERVER_ERROR,
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

export class UnauthorizedError extends ApiError {
    constructor(
        message = "Invalid auth credentials",
        context: Record<string, any> = {}
    ) {
        super(message, {
            code: "UNAUTHORIZED",
            statusCode: errorCodes.api.UNAUTHORIZED,
            isOperational: true,
            context,
        });
    }
}

export class ForbiddenError extends ApiError {
    constructor(
        message = "You do not have permission to perform this action",
        context: Record<string, any> = {}
    ) {
        super(message, {
            code: "FORBIDDEN",
            statusCode: errorCodes.api.FORBIDDEN,
            isOperational: true,
            context,
        });
    }
}

export class BadRequestError extends ApiError {
    public readonly validationErrors: Record<string, string[]>;

    constructor(
        message: string = "Malformed or invalid request",
        validationErrors: Record<string, string[]> = {},
        context: Record<string, any> = {}
    ) {
        super(message, {
            code: "BAD_REQUEST",
            statusCode: errorCodes.api.BAD_REQUEST,
            isOperational: true,
            context,
        });
        this.validationErrors = validationErrors;
    }
}

export class NotFoundError extends ApiError {
    constructor(
        entity: string = "Path",
        identifier?: string | number,
        context: Record<string, any> = {}
    ) {
        const message = identifier
            ? `${entity} with identifier ${identifier} not found`
            : `${entity} not found`;

        super(message, {
            code: "NOT_FOUND",
            statusCode: errorCodes.api.NOT_FOUND,
            isOperational: true,
            context: { entity, identifier, ...context },
        });
    }
}

export class RateLimitError extends ApiError {
    constructor(
        message = "Rate limit exceeded",
        context: Record<string, any> = {}
    ) {
        super(message, {
            code: "RATE_LIMIT",
            statusCode: errorCodes.api.TOO_MANY_REQUESTS,
            isOperational: true,
            context,
        });
    }
}

export class ExternalApiError extends ApiError {
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
            code: "EXTERNAL_API_ERROR",
            statusCode: errorCodes.api.EXTERNAL_GATEWAY_ERROR,
            isOperational: true,
            context: { apiName, externalCode, ...context },
        });

        this.apiName = apiName;
        this.externalCode = externalCode;
        this.rawError = rawError;
    }
}

export class DatabaseError extends ApiError {
    constructor(
        message: string,
        originalError?: Error,
        context: Record<string, any> = {}
    ) {
        super(message, {
            code: "DATABASE_ERROR",
            statusCode: errorCodes.api.INTERNAL_SERVER_ERROR,
            isOperational: true,
            context: {
                ...context,
                originalError: originalError
                    ? {
                          message: originalError.message,
                          name: originalError.name,
                      }
                    : undefined,
            },
        });
    }
}

export class TimeoutError extends ApiError {
    constructor(
        operation: string,
        timeoutMs: number,
        context: Record<string, any> = {}
    ) {
        super(`Operation '${operation}' timed out after ${timeoutMs}ms`, {
            code: "TIMEOUT",
            statusCode: 504, // Gateway Timeout
            isOperational: true,
            context: { operation, timeoutMs, ...context },
        });
    }
}
