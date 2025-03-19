import { Logger } from "bridge-hub-commons/helpers/logger";
import dotenv from "dotenv";

dotenv.config();

async function start(): Promise<void> {
    try {
        Logger.create({
            sentry: {
                dsn: process.env.SENTRY_DSN,
                level: "error",
            },
            console: {
                level: "info",
            },
        });

        Logger.info(
            `Consumer for network id ${process.env.NETWORK_ID} started`
        );
    } catch (error) {
        Logger.error(error as Error);
    }
}

start();
