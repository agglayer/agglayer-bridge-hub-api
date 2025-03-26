export interface IErrorResponse {
    status: "error";
    message: string;
    name: string;
    details?: any;
    requestId?: string;
    timestamp: string;
}

export interface IErrorHandlerOptions {
    includeStackTrace?: boolean;
    logErrors?: boolean;
}
