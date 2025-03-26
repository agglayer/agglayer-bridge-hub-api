import { ApiError } from "./api_errors";
import { Logger } from "../helpers/logger";
import type { IErrorResponse, IErrorHandlerOptions } from "../interfaces/error";

const defaultOptions: IErrorHandlerOptions = {
    includeStackTrace: true,
    logErrors: true,
};

/**
 * Formats an error into a standardized response object
 */
export function formatError(
    error: Error,
    requestId?: string,
    options: IErrorHandlerOptions = defaultOptions
): IErrorResponse {
    const timestamp = new Date().toISOString();

    // Handle AppError instances
    if (error instanceof ApiError) {
        const response: IErrorResponse = {
            status: "error",
            message: error.message,
            name: error.name,
            timestamp,
        };

        // Add request ID if available
        if (requestId) {
            response.requestId = requestId;
        }

        // Add validation errors or other context if available
        if (Object.keys(error.context).length > 0) {
            response.details = error.context;
        }

        // Add stack trace in non-production environments
        if (options.includeStackTrace && error.stack) {
            response.details = {
                ...response.details,
                stack: error.stack.split("\n"),
            };
        }

        return response;
    }

    // Handle generic errors
    const response: IErrorResponse = {
        status: "error",
        message: error.message || "An unexpected error occurred",
        name: "INTERNAL_ERROR",
        timestamp,
    };

    if (requestId) {
        response.requestId = requestId;
    }

    if (options.includeStackTrace && error.stack) {
        response.details = {
            stack: error.stack.split("\n"),
        };
    }

    return response;
}

/**
 * Handles errors by logging and formatting them
 * Can be used in both API and sync contexts
 */
export function handleError(
    error: Error,
    requestId?: string,
    options: IErrorHandlerOptions = defaultOptions
): IErrorResponse {
    // Determine if this is an operational or programming error
    const isOperational = error instanceof ApiError && !error.isFatal;

    // Log error appropriately
    if (options.logErrors) {
        if (isOperational) {
            Logger.error({
                message: `Operational error: ${error.message}`,
                requestId,
                errorName: error.name,
                ...(error instanceof ApiError ? error.context : {}),
            });
        } else {
            Logger.error({
                message: `Unhandled error: ${error.message}`,
                requestId,
                errorName: error.name,
            });
        }
    }

    // Format the error response
    return formatError(error, requestId, options);
}

/**
 * Creates express/bun compatible middleware for handling errors
 */
export function createErrorMiddleware(
    options: IErrorHandlerOptions = defaultOptions
) {
    return (err: Error, req: any, res: any, next: any) => {
        // Extract request ID if available
        const requestId = req.id || req.headers["x-request-id"];

        // Get status code (default to 500)
        const statusCode = err instanceof ApiError ? err.code : 500;

        // Format and handle the error
        const errorResponse = handleError(err, requestId, options);

        // Send error response
        res.status(statusCode).json(errorResponse);
    };
}
