import { BaseError } from "./base_error";
import { errorCodes } from "./error_codes";

export class ApiError extends BaseError {
    constructor(
        message: string,
        {
            name = "INTERNAL_SERVER_ERROR",
            code = errorCodes.api.INTERNAL_SERVER_ERROR,
            isFatal = true,
            origin = "api_errors",
            context = {},
        }: {
            name?: string;
            code?: number;
            isFatal?: boolean;
            origin?: string;
            context?: Record<string, any>;
        } = {}
    ) {
        super(name, code, message, isFatal, origin, context);
        Error.captureStackTrace(this, this.constructor);
    }
}

export class UnauthorizedError extends ApiError {
    constructor(
        message: string = "Invalid auth credentials",
        context: Record<string, any> = {},
        origin: string = "api_errors"
    ) {
        super(message, {
            name: "UNAUTHORIZED",
            code: errorCodes.api.UNAUTHORIZED,
            isFatal: true,
            origin,
            context,
        });
    }
}

export class ForbiddenError extends ApiError {
    constructor(
        message: string = "You do not have permission to perform this action",
        context: Record<string, any> = {},
        origin: string = "api_errors"
    ) {
        super(message, {
            name: "FORBIDDEN",
            code: errorCodes.api.FORBIDDEN,
            isFatal: true,
            origin,
            context,
        });
    }
}

export class BadRequestError extends ApiError {
    public readonly validationErrors: Record<string, string[]>;

    constructor(
        message: string = "Malformed or invalid request",
        validationErrors: Record<string, string[]> = {},
        context: Record<string, any> = {},
        origin: string = "api_errors"
    ) {
        super(message, {
            name: "BAD_REQUEST",
            code: errorCodes.api.BAD_REQUEST,
            isFatal: true,
            origin,
            context,
        });
        this.validationErrors = validationErrors;
    }
}

export class NotFoundError extends ApiError {
    constructor(
        entity: string = "Path",
        identifier?: string | number,
        context: Record<string, any> = {},
        origin: string = "api_errors"
    ) {
        const message = identifier
            ? `${entity} with identifier ${identifier} not found`
            : `${entity} not found`;

        super(message, {
            name: "NOT_FOUND",
            code: errorCodes.api.NOT_FOUND,
            isFatal: true,
            origin,
            context: { entity, identifier, ...context },
        });
    }
}

export class RateLimitError extends ApiError {
    constructor(
        message: string = "Rate limit exceeded",
        context: Record<string, any> = {},
        origin: string = "api_errors"
    ) {
        super(message, {
            name: "RATE_LIMIT",
            code: errorCodes.api.TOO_MANY_REQUESTS,
            isFatal: true,
            origin,
            context,
        });
    }
}

export class TimeoutError extends ApiError {
    constructor(
        operation: string,
        timeoutMs: number,
        context: Record<string, any> = {},
        origin: string = "api_errors"
    ) {
        super(`Operation '${operation}' timed out after ${timeoutMs}ms`, {
            name: "TIMEOUT",
            code: errorCodes.api.TIMEOUT_ERROR, // Gateway Timeout
            isFatal: true,
            origin,
            context: { operation, timeoutMs, ...context },
        });
    }
}
