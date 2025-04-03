import winston from "winston";

/**
 * Logger configuration interface
 */
export interface ILoggerConfig {
    sentry?: {
        dsn?: string;
        level?: string;
        environment?: string;
    };
    console?: {
        level?: string;
    };
    winston?: winston.LoggerOptions;
}
