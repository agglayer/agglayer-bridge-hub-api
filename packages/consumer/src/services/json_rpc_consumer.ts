import type { ConsumerError } from "bridge-hub-commons/errors/consumer_errors";
import { EventConsumer } from "./abstract_event_consumer";
import { JSONRPCClient } from "bridge-hub-commons/helpers/json_rpc_client";

class JsonRpcConsumer<T> extends EventConsumer {
    private client: JSONRPCClient;

    constructor(endpoint: string) {
        super();
        this.client = new JSONRPCClient(endpoint);
    }

    async request<T>(
        method: string,
        params?: string[]
    ): Promise<T | undefined> {
        try {
            return await this.client.call<T>({ method, params });
        } catch (error) {
            this.onFatalError(error as ConsumerError);
            throw error;
        }
    }
}

export { JsonRpcConsumer };
