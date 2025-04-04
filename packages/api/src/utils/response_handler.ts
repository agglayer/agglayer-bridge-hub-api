import type {
    ApiError,
    DatabaseError,
    ExternalDependencyError,
} from "bridge-hub-commons/errors";
import { errorCodes } from "bridge-hub-commons/constants/error_codes";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { httpResposneCodes } from "bridge-hub-commons/constants/http_success_codes";

export const handleResponse = (c: Context, data: any) => {
    return c.json(
        {
            status: "success",
            data: data,
        },
        httpResposneCodes.OK_RESPONSE as ContentfulStatusCode
    );
};

export const handleError = (
    c: Context,
    error: ApiError | ExternalDependencyError | DatabaseError
) => {
    return c.json(
        {
            status: "error",
            message: error.message,
            name: error.name,
            code: error.code,
            details: error.context,
        },
        (error.code as ContentfulStatusCode) ??
            errorCodes.api.INTERNAL_SERVER_ERROR
    );
};
