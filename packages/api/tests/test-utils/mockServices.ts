import { mock } from "bun:test";
import {
	mockServiceResponse,
	mockTransactionServiceResponse,
	mockProof,
	mockTokenMetadata,
	mockTransaction,
} from "./mockData";

// Mock MappingsService
export const mockMappingsService = {
	getMappings: mock(() => Promise.resolve(mockServiceResponse)),
	getMappingsByToken: mock(() => Promise.resolve(mockServiceResponse)),
};

// Mock TransactionService
export const mockTransactionService = {
	getTransactions: mock(() =>
		Promise.resolve(mockTransactionServiceResponse)
	),
	getTransactionByDepositCount: mock(() => Promise.resolve(mockTransaction)),
	generateDocId: mock(
		(depositCount: number, sourceNetworkId: number) =>
			`doc-${depositCount}-${sourceNetworkId}`
	),
};

// Mock ProofService
export const mockProofService = {
	getProof: mock(() => Promise.resolve(mockProof)),
};

// Mock TokenMetadataService
export const mockTokenMetadataService = {
	getTokenMetadata: mock(() => Promise.resolve(mockTokenMetadata)),
};

// Mock servercore functions
export const mockHandleResponse = mock(
	(context: any, data: any, meta?: any) => ({
		success: true,
		data,
		meta,
		context,
	})
);

export const mockHandleError = mock((context: any, error: any) => ({
	success: false,
	error: {
		code: error.code || "UNKNOWN_ERROR",
		message: error.message || "An error occurred",
	},
	context,
}));

// Mock response context middleware
export const mockGetResponseContext = mock(() => ({
	requestId: "test-request-id",
	correlationId: "test-correlation-id",
	userAgent: "test-user-agent",
	clientIp: "127.0.0.1",
	timestamp: Date.now(),
}));

// Clear all mocks function
export const clearAllMocks = () => {
	mockMappingsService.getMappings.mockClear();
	mockMappingsService.getMappingsByToken.mockClear();
	mockTransactionService.getTransactions.mockClear();
	mockTransactionService.getTransactionByDepositCount.mockClear();
	mockTransactionService.generateDocId.mockClear();
	mockProofService.getProof.mockClear();
	mockTokenMetadataService.getTokenMetadata.mockClear();
	mockHandleResponse.mockClear();
	mockHandleError.mockClear();
	mockGetResponseContext.mockClear();
};
