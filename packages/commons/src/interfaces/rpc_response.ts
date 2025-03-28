/**
 * Interface for JSON RPC response
 */
export interface IRPCResponse<T> {
    jsonrpc: "2.0";
    id: number | string;
    result?: T;
    error?: IRPCResponseError;
}

/**
 * Interface for JSON RPC response error
 */
export interface IRPCResponseError {
    code: number;
    message: string;
}
