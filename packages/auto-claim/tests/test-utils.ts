import type {
	ClaimProof,
	ClaimProofResponse,
	IHubTransaction,
	ITransactionResponse
} from '@agglayer/bridge-hub-types';

export const mockTransaction: IHubTransaction = {
	hubUID: 'test-hub-uid-123',
	blockNumber: 1000,
	transactionIndex: 1,
	timestamp: 1700000000,
	transactionHash: '0xabc123',
	leafType: 'ASSET',
	originTokenNetwork: 1,
	originTokenAddress: '0xOriginToken123',
	sourceNetwork: 1,
	destinationNetwork: 2442,
	receiverAddress: '0xReceiver123',
	fromAddress: '0xFrom123',
	amount: '1000000000000000000',
	depositCount: 42,
	bridgeHash: '0xbridge123',
	leafIndexForProof: 10,
	globalIndex: '123456789',
	status: 'READY_TO_CLAIM',
	lastUpdatedAt: Date.now(),
	txSender: '0xSender123',
	claimTransactionHash: '0xclaim123',
	claimBlockNumber: 2000,
	claimTimestamp: 1700005000
};

export const mockTransactionMessage: IHubTransaction = {
	...mockTransaction,
	hubUID: 'test-hub-uid-456',
	leafType: 'MESSAGE',
	depositCount: 43,
	amount: '500000000000000000'
};

export const mockTransactionWithoutLeafIndex: IHubTransaction = {
	...mockTransaction,
	hubUID: 'test-hub-uid-789',
	leafIndexForProof: undefined,
	depositCount: 44
};

export const mockClaimProof: ClaimProof = {
	proof_local_exit_root: [
		'0x0000000000000000000000000000000000000000000000000000000000000001',
		'0x0000000000000000000000000000000000000000000000000000000000000002'
	],
	proof_rollup_exit_root: [
		'0x0000000000000000000000000000000000000000000000000000000000000003',
		'0x0000000000000000000000000000000000000000000000000000000000000004'
	],
	l1_info_tree_leaf: {
		block_num: 1000,
		block_pos: 1,
		l1_info_tree_index: 100,
		previous_block_hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
		timestamp: 1700000000,
		mainnet_exit_root: '0x0000000000000000000000000000000000000000000000000000000000000005',
		rollup_exit_root: '0x0000000000000000000000000000000000000000000000000000000000000006',
		global_exit_root: '0x0000000000000000000000000000000000000000000000000000000000000007',
		hash: '0x0000000000000000000000000000000000000000000000000000000000000008'
	},
	bridge_tx_metadata: '0x'
};

export const mockClaimProofResponse: ClaimProofResponse = {
	success: true,
	data: mockClaimProof
};

export const mockTransactionResponse: ITransactionResponse = {
	success: true,
	data: [mockTransaction, mockTransactionMessage],
	pagination: {
		total: 2,
		limit: 50,
		nextStartAfterCursor: undefined
	}
};

export const mockTransactionResponseWithPagination: ITransactionResponse = {
	success: true,
	data: [mockTransaction],
	pagination: {
		total: 50,
		limit: 50,
		nextStartAfterCursor: 'test-hub-uid-123'
	}
};

export const mockEmptyTransactionResponse: ITransactionResponse = {
	success: true,
	data: [],
	pagination: {
		total: 0,
		limit: 50,
		nextStartAfterCursor: undefined
	}
};

export function createMockFetch(responses: Map<string, any> = new Map()) {
	return async (input: string | URL | Request) => {
		let url: string;
		if (typeof input === 'string') {
			url = input;
		} else if (input instanceof URL) {
			url = input.href;
		} else {
			url = input.url;
		}

		const response = responses.get(url);

		if (!response) {
			throw new Error(`No mock response configured for URL: ${url}`);
		}

		if (response instanceof Error) {
			throw response;
		}

		return {
			ok: true,
			status: 200,
			json: async () => response
		} as Response;
	};
}
