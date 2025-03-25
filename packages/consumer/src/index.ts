import { Logger } from "bridge-hub-commons/helpers/logger";
import { JSONRPCClient } from "bridge-hub-commons/helpers/json_rpc_client";
import dotenv from "dotenv";

dotenv.config();

let jsonRPCClient: JSONRPCClient;

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

        jsonRPCClient = new JSONRPCClient(process.env.BRIDGE_SERVICE_URL ?? "");

        Logger.info(
            `Consumer for network id ${process.env.NETWORK_ID} started`
        );
    } catch (error) {
        Logger.error(error as Error);
    }
}

start();
