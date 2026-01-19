import type {
	IHubTransaction,
	HubTokenMapping,
	TransactionsQuery,
	MappingsQuery,
	TokenMetadata,
} from "../src/schemas";
import type {
	ClaimProofResponse,
	ClaimProofQuery,
} from "../src/schemas/proof_query";

// Mock transactions
export const mockTransaction: IHubTransaction = {
	depositCount: 42,
	fromAddress: "0x1234567890abcdef1234567890abcdef12345678",
	toAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
	tokenAddress: "0x0000000000000000000000000000000000000000",
	amount: "1000000000000000000",
	sourceNetwork: 1,
	destinationNetwork: 137,
	transactionHash:
		"0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456",
	blockNumber: 12345,
	timestamp: 1700000000,
	hubUID: "hub-uid-42-1",
	status: "BRIDGED",
	lastUpdatedAt: 1700000000,
};

export const mockTransactionServiceResponse = {
	documents: [mockTransaction],
	totalDocumentsCount: 1,
};

export const mockTransactionsQuery: TransactionsQuery = {
	network: "testnet",
	fromAddress: "0x1234567890abcdef1234567890abcdef12345678",
	sourceNetworkIds: [1],
	destinationNetworkIds: [137],
	status: "BRIDGED",
	limit: 10,
	startAfter: "hub-uid-123",
};

// Mock mappings
export const mockMapping: HubTokenMapping = {
	originTokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
	wrappedTokenAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
	originTokenNetwork: 1,
	wrappedTokenNetwork: 137,
	timestamp: 1700000000,
};

// Alias for backwards compatibility
export const mockTokenMapping = mockMapping;

export const mockServiceResponse = {
	documents: [mockMapping],
	totalDocumentsCount: 1,
};

export const mockMappingsQuery: MappingsQuery = {
	network: "testnet",
	originTokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
	wrappedTokenAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
	originNetworkIds: [1],
	wrappedNetworkIds: [137],
	limit: 10,
	startAfter: 1700000000,
};

// Mock token metadata
export const mockTokenMetadata: TokenMetadata = {
	name: "Test Token",
	symbol: "TEST",
	decimals: 18,
	originTokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
	originTokenNetwork: 1,
	wrappedTokenAddressV1: "0xabcdef1234567890abcdef1234567890abcdef12",
	wrappedTokenAddressV2: "0xfedcba0987654321fedcba0987654321fedcba09",
};

// Mock proof
export const mockProof: ClaimProofResponse = {
	proof_local_exit_root: ["0xproof1", "0xproof2", "0xproof3"],
	proof_rollup_exit_root: ["0xrollup1", "0xrollup2"],
	l1_info_tree_leaf: {
		block_num: 12345,
		block_pos: 1,
		l1_info_tree_index: 50,
		previous_block_hash:
			"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
		timestamp: 1700000000,
		mainnet_exit_root:
			"0xmainnetroot1234567890abcdef1234567890abcdef1234567890abcdef12",
		rollup_exit_root:
			"0xrolluproot1234567890abcdef1234567890abcdef1234567890abcdef123",
		global_exit_root:
			"0xglobalroot1234567890abcdef1234567890abcdef1234567890abcdef123",
		hash: "0xhash1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
	},
};

export const mockProofQuery: ClaimProofQuery = {
	sourceNetworkId: 1,
	depositCount: 42,
	leafIndex: 100,
};

// Mock Hono context
export function createMockContext() {
	return {
		req: {
			query: () => ({}),
			param: () => ({}),
			header: () => undefined,
		},
		json: (data: any) => data,
		text: (data: string) => data,
		status: () => {},
		set: () => {},
		get: () => undefined,
	} as any;
}

// Utility function to clear all mocks
export function clearAllMocks() {
	// This is a placeholder - each test file will implement its own mock clearing
}
