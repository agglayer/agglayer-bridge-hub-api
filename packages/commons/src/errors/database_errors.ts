import { BaseError } from "./base_error";
import { errorCodes } from "../constants/error_codes";

export class DatabaseError extends BaseError {
    constructor(
        message: string,
        originalError?: Error,
        {
            name = "CONSUMER_ERROR",
            code = errorCodes.consumer.UNKNOWN_CONSUMER_ERR,
            isFatal = true,
            origin = "databse_errors",
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
