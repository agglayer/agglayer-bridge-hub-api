import { BaseError } from "./base_error";
import { errorCodes } from "./error_codes";

export class ExternalDependencyError extends BaseError {
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
            origin = "external_dependency_error",
        }: {
            externalCode?: string | number;
            rawError?: any;
            context?: Record<string, any>;
            origin?: string;
        } = {}
    ) {
        super(
            "EXTERNAL_DEPENDENCY_ERROR",
            errorCodes.external.UNKNOWN_EXTERNAL_DEPENDENCY_ERROR,
            true,
            `${apiName} API error: ${message}`,
            origin,
            { apiName, externalCode, ...context }
        );

        this.apiName = apiName;
        this.externalCode = externalCode;
        this.rawError = rawError;
    }
}
