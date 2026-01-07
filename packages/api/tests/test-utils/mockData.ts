import type { HubTokenMapping, IHubTransaction } from "../../src/schemas";

// Mock mappings data
export const mockMapping: HubTokenMapping = {
	originTokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
	originTokenNetwork: 1,
	wrappedTokenAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
	wrappedTokenNetwork: 137,
	blockNumber: 12345,
	transactionIndex: 1,
	timestamp: 1700000000,
	transactionHash: "0xhash123",
	lastUpdatedAt: 1700000000,
};

// Alias for compatibility with existing tests
export const mockTokenMapping = mockMapping;

export const mockMappings: HubTokenMapping[] = [
	mockMapping,
	{
		...mockMapping,
		originTokenAddress: "0x9876543210fedcba9876543210fedcba98765432",
		originTokenNetwork: 2,
		blockNumber: 12346,
		timestamp: 1700001000,
		transactionHash: "0xhash124",
	},
];

// Mock transaction data
export const mockTransaction: IHubTransaction = {
	hubUID: "hub-uid-123",
	blockNumber: 54321,
	transactionIndex: 2,
	timestamp: 1700002000,
	transactionHash: "0xtxhash456",
	leafType: "ASSET",
	originTokenNetwork: 1,
	originTokenAddress: "0xorigin123",
	sourceNetwork: 1,
	destinationNetwork: 137,
	receiverAddress: "0xreceiver456",
	fromAddress: "0xfrom789",
	amount: 1000000,
	depositCount: 42,
	bridgeHash: "0xbridge123",
	status: "BRIDGED",
	lastUpdatedAt: 1700002000,
};

export const mockTransactions: IHubTransaction[] = [
	mockTransaction,
	{
		...mockTransaction,
		hubUID: "hub-uid-124",
		blockNumber: 54322,
		depositCount: 43,
		status: "CLAIMED",
		transactionHash: "0xtxhash457",
	},
];

// Mock proof data
export const mockProof = {
	proof_local_exit_root: [
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
		"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
	],
	proof_rollup_exit_root: [
		"0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
	],
	l1_info_tree_leaf: {
		block_num: 12345,
		block_pos: 1,
		l1_info_tree_index: 42,
		previous_block_hash: "0xprevioushash123456789abcdef",
		timestamp: 1700000000,
		mainnet_exit_root: "0xmainexitroot123456789abcdef",
		rollup_exit_root: "0xrollupexitroot123456789abcdef",
		global_exit_root: "0xglobalexitroot123456789abcdef",
		hash: "0xleafhash123456789abcdef",
	},
};

// Mock token metadata
export const mockTokenMetadata = {
	name: "Test Token",
	symbol: "TEST",
	decimals: 18,
	originTokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
	originTokenNetwork: 1,
	wrappedTokenAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
	wrappedTokenNetwork: 137,
};

// Mock service responses
export const mockServiceResponse = {
	documents: mockMappings,
	totalDocumentsCount: 2,
};

export const mockTransactionServiceResponse = {
	documents: mockTransactions,
	totalDocumentsCount: 2,
};

// Mock query parameters
export const mockMappingsQuery = {
	originTokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
	wrappedTokenAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
	originNetworkIds: [1, 2],
	wrappedNetworkIds: [137],
	limit: 10,
	startAfter: 1700000000,
};

export const mockTransactionsQuery = {
	fromAddress: "0xfrom789",
	sourceNetworkIds: [1, 2],
	destinationNetworkIds: [137],
	updatedSince: 1700000000,
	status: "BRIDGED",
	order: "asc" as const,
	limit: 10,
	startAfter: "hub-uid-123",
};

export const mockProofQuery = {
	sourceNetworkId: 1,
	depositCount: 42,
	leafIndex: 100,
};

// Mock validation params
export const mockParams = {
	network: "testnet",
	tokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
	tokenNetwork: 1,
	sourceNetworkId: 1,
	depositCount: 42,
};

// Mock error responses
export const mockApiError = {
	code: "API_ERROR",
	message: "Test API error",
	statusCode: 400,
};

export const mockExternalDependencyError = {
	code: "EXTERNAL_DEPENDENCY_ERROR",
	message: "External service unavailable",
	statusCode: 502,
};
