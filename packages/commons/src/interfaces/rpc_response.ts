export interface IRPCResponse<T> {
    jsonrpc: "2.0";
    id: number | string;
    result?: T;
    error?: IRPCResponseError;
}

export interface IRPCResponseError {
    code: number;
    message: string;
}
