export const errorCodes = {
    // Base error identifier
    base: { BASE_ERROR: 100 },

    // Consumer related errors
    consumer: {
        UNKNOWN_CONSUMER_ERR: 1000,
        BRIDGE_RPC_ERROR: 1001,
    },

    // Datastore related errors
    datastore: {
        UNKNOWN_DATASTORE_ERR: 2000,
        DATASTORE_AUTH_ERR: 2001,
        DATASTORE_READ_ERROR: 1002,
        DATASTORE_WRITE_ERROR: 1003,
    },

    // API error codes
    api: {
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        TOO_MANY_REQUESTS: 429,
        INTERNAL_SERVER_ERROR: 500,
        EXTERNAL_GATEWAY_ERROR: 502,
    },
};
