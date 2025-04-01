/**
 * BaseError used within the micro services that guarantees we don't loose the stack trace.
 */
export class BaseError extends Error {
    public readonly name: string;
    public readonly code: number;
    public readonly isFatal: boolean;
    public readonly origin: string;
    public readonly context: Record<string, any>;
    /**
     * @param name {string} - The error name
     * @param code {number} - The error code
     * @param isFatal {boolean} - Flag to know if it is a fatal error
     * @param message {string} - The actual error message
     * @param origin {string} - The point this error originated
     * @param context Record<string, any> - The stack trace
     */
    constructor(
        name: string,
        code: number,
        message: string = "Unknown error",
        isFatal?: boolean | undefined,
        origin?: string | undefined,
        context?: Record<string, any>
    ) {
        super(message);
        this.name = name;
        this.code = code;
        this.isFatal = isFatal ?? true;
        this.origin = origin ?? "base_error";
        this.context = context ?? {};
    }
    static codes: {
        BASE_ERROR: number;
    };
    identifier: number = BaseError.codes.BASE_ERROR;
}
