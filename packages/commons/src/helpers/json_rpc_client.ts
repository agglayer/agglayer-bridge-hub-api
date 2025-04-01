import https from "https";
import type { IRPCPayload } from "../interfaces/rpc_payload";
import { Logger } from "./logger";
import { ExternalDependencyError } from "../errors/external_dependency_error";
import type { IRPCResponse } from "../interfaces/rpc_response";
import type { IBridgeAPIResult } from "../interfaces/bridge_api_result";

// ToDo: Need to remove this part once we move away from internal testnet
// const httpsAgent = new https.Agent({
//     rejectUnauthorized: false,
// });

/**
 * A utility class to make RPC calls to the given node URL.
 */
export class JSONRPCClient {
    /**
     * @constructor
     *
     * @param {string} url - The url of the node to make RPC call.
     */
    constructor(private url: string) {}

    /**
     * Method to make an rpc call
     *
     * @param {IRPCPayload} payload
     *
     * @returns {Promise<any>}
     */
    public async call<T>(payload: IRPCPayload): Promise<T | undefined> {
        try {
            const response = await fetch(new Request(this.url), {
                method: "POST",
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: new Date().getTime(),
                    method: payload.method,
                    params: payload.params ?? [],
                }),
            });

            const json: IRPCResponse<T> = await response.json();

            if (json.error) {
                throw new ExternalDependencyError(
                    `rpc: ${this.url}`,
                    json.error.message,
                    {
                        externalCode: json.error.code,
                    }
                );
            }

            return json.result;
        } catch (error) {
            Logger.error(error as ExternalDependencyError);
            throw error;
        }
    }
}
