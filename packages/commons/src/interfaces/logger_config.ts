import winston from "winston";

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
