import { describe, test, expect, beforeEach } from "bun:test";
import TransactionMapper from "../../src/mappers/transaction";
import { LeafType } from "../../src/enums/leaf_type";
import { TransactionStatus } from "../../src/enums/transaction_status";
import {
	mockBridgeTx,
	mockBridgeTxs,
	mockClaimTx,
	mockClaimTxs,
	MOCK_NETWORK_ID,
} from "../test-utils";

describe("TransactionMapper", () => {
	let mapper: TransactionMapper;

	beforeEach(() => {
		mapper = new TransactionMapper(MOCK_NETWORK_ID);
	});

	describe("constructor", () => {
		test("should initialize with network ID", () => {
			const networkId = 42;
			const testMapper = new TransactionMapper(networkId);
			expect(testMapper).toBeInstanceOf(TransactionMapper);
		});
	});

	describe("mapBridgeTransactions", () => {
		test("should map empty array correctly", () => {
			const result = mapper.mapBridgeTransactions([]);
			expect(result).toEqual([]);
		});

		test("should map single bridge transaction correctly", () => {
			const result = mapper.mapBridgeTransactions([mockBridgeTx]);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				hubUID: expect.any(String),
				blockNumber: mockBridgeTx.block_num,
				transactionIndex: mockBridgeTx.block_pos,
				timestamp: mockBridgeTx.block_timestamp,
				transactionHash: mockBridgeTx.tx_hash.toLowerCase(),
				leafType: "ASSET",
				originTokenNetwork: mockBridgeTx.origin_network,
				originTokenAddress: mockBridgeTx.origin_address.toLowerCase(),
				sourceNetwork: MOCK_NETWORK_ID,
				destinationNetwork: mockBridgeTx.destination_network,
				receiverAddress: mockBridgeTx.destination_address.toLowerCase(),
				fromAddress: mockBridgeTx.from_address.toLowerCase(),
				amount: mockBridgeTx.amount,
				depositCount: mockBridgeTx.deposit_count,
				bridgeHash: mockBridgeTx.bridge_hash,
				status: TransactionStatus.BRIDGED,
				lastUpdatedAt: expect.any(Number),
			});
		});

		test("should map multiple bridge transactions correctly", () => {
			const result = mapper.mapBridgeTransactions(mockBridgeTxs);

			expect(result).toHaveLength(2);
			expect(result[0].leafType).toBe("ASSET");
			expect(result[1].leafType).toBe("MESSAGE");
		});

		test("should map leaf type correctly", () => {
			const assetTx = { ...mockBridgeTx, leaf_type: LeafType.ASSET };
			const messageTx = { ...mockBridgeTx, leaf_type: LeafType.MESSAGE };

			const assetResult = mapper.mapBridgeTransactions([assetTx]);
			const messageResult = mapper.mapBridgeTransactions([messageTx]);

			expect(assetResult[0].leafType).toBe("ASSET");
			expect(messageResult[0].leafType).toBe("MESSAGE");
		});

		test("should convert addresses and hash to lowercase", () => {
			const txWithUppercase = {
				...mockBridgeTx,
				tx_hash: "0xUPPERCASEHASH123",
				origin_address: "0xUPPERCASEORIGIN123",
				destination_address: "0xUPPERCASEDEST123",
				from_address: "0xUPPERCASEFROM123",
			};

			const result = mapper.mapBridgeTransactions([txWithUppercase]);

			expect(result[0].transactionHash).toBe("0xuppercasehash123");
			expect(result[0].originTokenAddress).toBe("0xuppercaseorigin123");
			expect(result[0].receiverAddress).toBe("0xuppercasedest123");
			expect(result[0].fromAddress).toBe("0xuppercasefrom123");
		});

		test("should generate deterministic hubUID", () => {
			const result1 = mapper.mapBridgeTransactions([mockBridgeTx]);
			const result2 = mapper.mapBridgeTransactions([mockBridgeTx]);

			expect(result1[0].hubUID).toBe(result2[0].hubUID);
			expect(result1[0].hubUID).toMatch(
				/^[0-9A-HJKMNP-TV-Z]{26}-\d+-\d+$/
			); // ULID format with network and deposit count
		});

		test("should set source network from constructor", () => {
			const differentNetworkId = 1;
			const differentMapper = new TransactionMapper(differentNetworkId);

			const result = differentMapper.mapBridgeTransactions([
				mockBridgeTx,
			]);

			expect(result[0].sourceNetwork).toBe(differentNetworkId);
		});
	});

	describe("mapClaimTransactions", () => {
		test("should map empty array correctly", () => {
			const result = mapper.mapClaimTransactions([]);
			expect(result).toEqual([]);
		});

		test("should map single claim transaction correctly", () => {
			const result = mapper.mapClaimTransactions([mockClaimTx]);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				claimTransactionHash: mockClaimTx.tx_hash.toLowerCase(),
				claimBlockNumber: mockClaimTx.block_num,
				claimTimestamp: mockClaimTx.block_timestamp,
				globalIndex: mockClaimTx.global_index,
				sourceNetwork: expect.any(Number),
				depositCount: expect.any(Number),
				status: TransactionStatus.CLAIMED,
				lastUpdatedAt: expect.any(Number),
			});
		});

		test("should map multiple claim transactions correctly", () => {
			const result = mapper.mapClaimTransactions(mockClaimTxs);

			expect(result).toHaveLength(2);
			expect(result[0].globalIndex).toBe(mockClaimTxs[0].global_index);
			expect(result[1].globalIndex).toBe(mockClaimTxs[1].global_index);
		});

		test("should convert transaction hash to lowercase", () => {
			const claimWithUppercase = {
				...mockClaimTx,
				tx_hash: "0xUPPERCASECLAIMHASH123",
			};

			const result = mapper.mapClaimTransactions([claimWithUppercase]);

			expect(result[0].claimTransactionHash).toBe(
				"0xuppercaseclaimhash123"
			);
		});
	});

	describe("decodeGlobalIndex", () => {
		test("should decode global index correctly for small values", () => {
			// Test with a small global index (42)
			const smallGlobalIndex = "42";
			const result = mapper.mapClaimTransactions([
				{ ...mockClaimTx, global_index: smallGlobalIndex },
			]);

			expect(result[0].sourceNetwork).toBe(0); // networkId !== 0, so returns 0
			expect(result[0].depositCount).toBe(42); // 42 & 0xffffffff
		});

		test("should decode global index correctly for small values with networkId 0", () => {
			// Test with networkId 0 (pre-etrog behavior)
			const mapperNetworkId0 = new TransactionMapper(0);
			const smallGlobalIndex = "42";
			const result = mapperNetworkId0.mapClaimTransactions([
				{ ...mockClaimTx, global_index: smallGlobalIndex },
			]);

			expect(result[0].sourceNetwork).toBe(1); // networkId === 0, so returns 1
			expect(result[0].depositCount).toBe(42);
		});

		test("should decode global index correctly for large values", () => {
			// Test with a large global index that encodes both network and deposit count
			// Use a smaller value that has hex length <= 16
			const largeGlobalIndex = (42 * Math.pow(2, 32) + 100).toString(); // This will be hex length <= 16
			const result = mapper.mapClaimTransactions([
				{ ...mockClaimTx, global_index: largeGlobalIndex },
			]);

			expect(result[0].sourceNetwork).toBe(43); // 42 + 1
			expect(result[0].depositCount).toBe(100);
		});

		test("should handle global index with hex length > 16", () => {
			// Test with a very large global index that has hex length > 16
			// Use a value larger than what fits in 16 hex digits
			const veryLargeGlobalIndex = BigInt("0x10000000000000000"); // 17 hex digits
			const result = mapper.mapClaimTransactions([
				{
					...mockClaimTx,
					global_index: veryLargeGlobalIndex.toString(),
				},
			]);

			expect(result[0].sourceNetwork).toBe(0);
			expect(result[0].depositCount).toBe(
				Number(veryLargeGlobalIndex & 0xffffffffn)
			);
		});
	});
});
