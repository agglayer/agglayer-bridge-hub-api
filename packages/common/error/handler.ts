import { AppError } from './types';
import { Logger } from '../logger';
import { config } from '../config';

export interface ErrorResponse {
    status: 'error';
    message: string;
    code: string;
    details?: any;
    requestId?: string;
    timestamp: string;
}

export interface ErrorHandlerOptions {
    includeStackTrace?: boolean;
    logErrors?: boolean;
}

const defaultOptions: ErrorHandlerOptions = {
    includeStackTrace: config.environment !== 'prod',
    logErrors: true,
};

/**
 * Formats an error into a standardized response object
 */
export function formatError(
    error: Error,
    requestId?: string,
    options: ErrorHandlerOptions = defaultOptions
): ErrorResponse {
    const timestamp = new Date().toISOString();

    // Handle AppError instances
    if (error instanceof AppError) {
        const response: ErrorResponse = {
            status: 'error',
            message: error.message,
            code: error.code,
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
                stack: error.stack.split('\n'),
            };
        }

        return response;
    }

    // Handle generic errors
    const response: ErrorResponse = {
        status: 'error',
        message: error.message || 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
        timestamp,
    };

    if (requestId) {
        response.requestId = requestId;
    }

    if (options.includeStackTrace && error.stack) {
        response.details = {
            stack: error.stack.split('\n'),
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
    options: ErrorHandlerOptions = defaultOptions
): ErrorResponse {
    // Determine if this is an operational or programming error
    const isOperational = error instanceof AppError && error.isOperational;

    // Log error appropriately
    if (options.logErrors) {
        if (isOperational) {
            Logger.error({
                message: `Operational error: ${error.message}`,
                requestId,
                errorName: error.name,
                ...(error instanceof AppError ? error.context : {}),
            });
        } else {
            Logger.error({
                message: `Unhandled error: ${error.message}`,
                requestId,
                errorName: error.name
            })
        }
    }

    // Format the error response
    return formatError(error, requestId, options);
}

/**
 * Creates express/bun compatible middleware for handling errors
 */
export function createErrorMiddleware(options: ErrorHandlerOptions = defaultOptions) {
    return (err: Error, req: any, res: any, next: any) => {
        // Extract request ID if available
        const requestId = req.id || req.headers['x-request-id'];

        // Get status code (default to 500)
        const statusCode = err instanceof AppError ? err.statusCode : 500;

        // Format and handle the error
        const errorResponse = handleError(err, requestId, options);

        // Send error response
        res.status(statusCode).json(errorResponse);
    };
}