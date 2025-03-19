import { config } from "./common/config";
import { Logger } from "../packages/common/src/helpers/logger";
import { startServer } from "./api/server";

Logger.create({
    sentry: {
        dsn: process.env.SENTRY_DSN,
        level: "error",
    },
    datadog: {
        api_key: process.env.DATADOG_API_KEY,
        service_name: process.env.DATADOG_APP_KEY,
    },
    console: {
        level: "debug",
    },
});

async function bootstrap() {
    try {
        Logger.info({
            name: "Starting application",
            environment: config.environment,
            version: process.env.npm_package_version || "unknown",
        });

        await startServer();

        Logger.info("Application startup complete");
    } catch (error) {
        Logger.error({
            message: "Fatal error during application startup",
            error,
        });
        process.exit(1);
    }
}

bootstrap();
