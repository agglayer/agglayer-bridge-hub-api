import type { JSONRPCClient } from "../helpers/json_rpc_client";

export interface IConsumerConfig {
    name: string;
    startBlock: number;
    pollInterval: number;
    pollSize: number;
    networkId: number;
    maxRetries: number;
    requestMethod: string;
}
