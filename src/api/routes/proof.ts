import { Elysia, t } from "elysia";
import { ProofApiService } from "../../services/proof";
import { Logger } from "../../../packages/common/src/helpers/logger";
import { config } from "../../common/config";
import { ValidationError, ExternalApiError } from "../../common/error";

const proofApiService = new ProofApiService(config.network_base_urls);

export function setupProofApiRoutes(app: Elysia): Elysia {
    return app.get(
        "/",
        async ({ query, set }) => {
            const { depositCount, networkId } = query;
            Logger.info(
                `Starting Proof API request for network=${networkId} & depositCount=${depositCount}`
            );

            try {
                const finalResult = await proofApiService.getProof(
                    Number(depositCount),
                    Number(networkId)
                );
                Logger.info("Proof API request completed successfully");

                return {
                    status: "success",
                    data: finalResult,
                    metadata: {
                        processedAt: new Date().toISOString(),
                    },
                };
            } catch (error) {
                if (error instanceof ExternalApiError) {
                    error.context.chainStep = error.apiName;

                    set.status = error.statusCode;

                    return {
                        status: "error",
                        message: error.message,
                        code: error.code,
                        details: error.context,
                        timestamp: new Date().toISOString(),
                    };
                }

                set.status = error instanceof ValidationError ? 400 : 500;

                return {
                    status: "error",
                    message:
                        error instanceof Error
                            ? error.message
                            : "An unknown error occurred",
                    code:
                        error instanceof ValidationError
                            ? "VALIDATION_ERROR"
                            : "INTERNAL_ERROR",
                    timestamp: new Date().toISOString(),
                };
            }
        },
        {
            query: t.Object({
                depositCount: t.String({
                    pattern: "^[0-9]$",
                    error: "Invalid depositCount",
                }),
                networkId: t.String({
                    pattern: "^[0-9]$",
                    error: "Invalid networkId",
                }),
            }),
            error({ code, error, set }) {
                // Handle validation errors from Elysia's built-in validation
                if (code === "VALIDATION") {
                    set.status = 400;
                    return {
                        status: "error",
                        message: "Validation failed",
                        code: "VALIDATION_ERROR",
                        details: {
                            errors: error.message,
                        },
                        timestamp: new Date().toISOString(),
                    };
                }
            },
        }
    );
}
