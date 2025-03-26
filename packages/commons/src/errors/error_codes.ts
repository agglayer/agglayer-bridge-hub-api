export const errorCodes = {
    // Base error identifier
    base: { BASE_ERROR: 100 },

    // Consumer related error codes
    consumer: {
        UNKNOWN_CONSUMER_ERR: 1000,
        BRIDGE_RPC_ERROR: 1001,
    },

    // Datastore related error codes
    datastore: {
        UNKNOWN_DATASTORE_ERR: 2000,
        DATASTORE_AUTH_ERR: 2001,
        DATASTORE_READ_ERROR: 1002,
        DATASTORE_WRITE_ERROR: 1003,
    },

    // External dependencies errors codes
    external: {
        UNKNOWN_EXTERNAL_DEPENDENCY_ERROR: 3000,
    },

    // API error codes
    api: {
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        TOO_MANY_REQUESTS: 429,
        INTERNAL_SERVER_ERROR: 500,
        GATEWAY_ERROR: 502,
        TIMEOUT_ERROR: 504,
    },
};
