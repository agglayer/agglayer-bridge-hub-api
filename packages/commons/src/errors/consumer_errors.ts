import { BaseError } from "./base_error";
import { errorCodes } from "./error_codes";

export class ConsumerError extends BaseError {
    constructor(
        message: string,
        {
            name = "CONSUMER_ERROR",
            code = errorCodes.consumer.UNKNOWN_CONSUMER_ERR,
            isFatal = true,
            origin = "consumer_errors",
            context = {},
        }: {
            name?: string;
            code?: number;
            isFatal?: boolean;
            origin?: string;
            context?: Record<string, any>;
        } = {}
    ) {
        super(name, code, isFatal, message, origin, context);
        Error.captureStackTrace(this, this.constructor);
    }
}
