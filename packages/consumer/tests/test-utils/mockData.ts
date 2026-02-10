import type {
	IMappingTx,
	IHubTokenMappings,
} from "../../src/interfaces/token_mapping";
import type {
	IBridgeTx,
	IHubBridgeTransaction,
} from "../../src/interfaces/bridge_tx";
import type {
	IClaimTx,
	IHubClaimTransaction,
} from "../../src/interfaces/claim_tx";
import type {
	ILastIndexedBridgeTransaction,
	ILastIndexedClaimTransaction,
	ILastIndexedMappingTransaction,
	IHubMetadata,
} from "../../src/interfaces/metadata";
import { LeafType } from "../../src/enums/leaf_type";
import { TransactionStatus } from "@agglayer/bridge-hub-commons";

export const mockMappingTx: IMappingTx = {
	metadata: "0x",
	calldata: "0x123456",
	block_num: 12345,
	block_pos: 1,
	block_timestamp: 1700000000,
	tx_hash: "0xABCDEF1234567890",
	origin_network: 1,
	origin_token_address: "0x1234567890ABCDEF1234567890ABCDEF12345678",
	wrapped_token_address: "0xFEDCBA0987654321FEDCBA0987654321FEDCBA09",
};

export const mockMappingTxs: IMappingTx[] = [
	mockMappingTx,
	{
		...mockMappingTx,
		block_num: 12346,
		block_pos: 2,
		tx_hash: "0x9876543210FEDCBA9876543210FEDCBA98765432",
		origin_network: 2,
	},
];

export const mockExpectedHubTokenMapping: IHubTokenMappings = {
	blockNumber: 12345,
	transactionIndex: 1,
	timestamp: 1700000000,
	transactionHash: "0xabcdef1234567890",
	originTokenNetwork: 1,
	originTokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
	wrappedTokenNetwork: 137,
	wrappedTokenAddress: "0xfedcba0987654321fedcba0987654321fedcba09",
	lastUpdatedAt: 1700000000,
};

export const mockBridgeTx: IBridgeTx = {
	metadata: "0x",
	calldata: "0x789abc",
	bridge_hash: "0xBRIDGEHASH123456789",
	block_num: 54321,
	block_pos: 3,
	block_timestamp: 1700001000,
	leaf_type: LeafType.ASSET,
	origin_network: 1,
	origin_address: "0x1111222233334444555566667777888899990000",
	destination_network: 137,
	destination_address: "0xAAAABBBBCCCCDDDDEEEEFFFF0000111122223333",
	amount: "1000000",
	deposit_count: 42,
	tx_hash: "0xBRIDGETXHASH123456789",
	from_address: "0xFROMUSER123456789ABCDEF",
	txn_sender: "0xRELAYER123456789ABCDEF",
};

export const mockBridgeTxs: IBridgeTx[] = [
	mockBridgeTx,
	{
		...mockBridgeTx,
		block_num: 54322,
		block_pos: 4,
		leaf_type: LeafType.MESSAGE,
		deposit_count: 43,
		tx_hash: "0xBRIDGETXHASH987654321",
	},
];

export const mockExpectedHubBridgeTransaction: IHubBridgeTransaction = {
	hubUID: "test-hub-uid",
	blockNumber: 54321,
	transactionIndex: 3,
	timestamp: 1700001000,
	transactionHash: "0xbridgetxhash123456789",
	leafType: "ASSET",
	originTokenNetwork: 1,
	originTokenAddress: "0x1111222233334444555566667777888899990000",
	sourceNetwork: 137,
	destinationNetwork: 137,
	receiverAddress: "0xaaaabbbbccccddddeeeeffff0000111122223333",
	fromAddress: "0xfromuser123456789abcdef",
	amount: "1000000",
	depositCount: 42,
	bridgeHash: "0xBRIDGEHASH123456789",
	status: TransactionStatus.BRIDGED,
	lastUpdatedAt: 1700001000,
	txSender: "0xrelayer123456789abcdef",
};

export const mockClaimTx: IClaimTx = {
	block_num: 98765,
	block_timestamp: 1700002000,
	tx_hash: "0xCLAIMTXHASH123456789",
	global_index: "184467440737095516202", // This encodes sourceNetwork=42 and depositCount=42
	origin_address: "0x2222333344445555666677778888999900001111",
	origin_network: 42,
	destination_address: "0xDESTINATION123456789ABCDEF",
	destination_network: 137,
	amount: "2000000",
	from_address: "0xCLAIMUSER123456789ABCDEF",
};

export const mockClaimTxs: IClaimTx[] = [
	mockClaimTx,
	{
		...mockClaimTx,
		block_num: 98766,
		global_index: "184467440737095516203",
		tx_hash: "0xCLAIMTXHASH987654321",
	},
];

export const mockExpectedHubClaimTransaction: IHubClaimTransaction = {
	claimTransactionHash: "0xclaimtxhash123456789",
	claimBlockNumber: 98765,
	claimTimestamp: 1700002000,
	globalIndex: "184467440737095516202",
	sourceNetwork: 43,
	depositCount: 42,
	status: TransactionStatus.CLAIMED,
	lastUpdatedAt: 1700002000,
};

export const mockLastIndexedBridgeTransaction: ILastIndexedBridgeTransaction = {
	deposit_count: 100,
};

export const mockLastIndexedClaimTransaction: ILastIndexedClaimTransaction = {
	block_num: 50000,
};

export const mockLastIndexedMappingTransaction: ILastIndexedMappingTransaction =
	{
		block_num: 60000,
	};

export const mockExpectedHubMetadataBridge: IHubMetadata = {
	lastIndexedBridgeDepositCount: 100,
};

export const mockExpectedHubMetadataClaim: IHubMetadata = {
	lastIndexedClaimBlockNumber: 50000,
};

export const mockExpectedHubMetadataMapping: IHubMetadata = {
	lastIndexedMappingBlockNumber: 60000,
};

export const MOCK_NETWORK_ID = 137;
