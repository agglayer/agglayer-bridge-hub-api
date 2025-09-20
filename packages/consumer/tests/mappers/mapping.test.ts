import { describe, test, expect, beforeEach } from "bun:test";
import TokenMappingsMapper from "../../src/mappers/mapping";
import { mockMappingTx, mockMappingTxs, MOCK_NETWORK_ID } from "../test-utils";

describe("TokenMappingsMapper", () => {
	let mapper: TokenMappingsMapper;

	beforeEach(() => {
		mapper = new TokenMappingsMapper(MOCK_NETWORK_ID);
	});

	describe("constructor", () => {
		test("should initialize with network ID", () => {
			const networkId = 42;
			const testMapper = new TokenMappingsMapper(networkId);
			expect(testMapper).toBeInstanceOf(TokenMappingsMapper);
		});
	});

	describe("mapMappings", () => {
		test("should map empty array correctly", () => {
			const result = mapper.mapMappings([]);
			expect(result).toEqual([]);
		});

		test("should map single mapping transaction correctly", () => {
			const result = mapper.mapMappings([mockMappingTx]);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				blockNumber: mockMappingTx.block_num,
				transactionIndex: mockMappingTx.block_pos,
				timestamp: mockMappingTx.block_timestamp,
				transactionHash: mockMappingTx.tx_hash.toLowerCase(),
				originTokenNetwork: mockMappingTx.origin_network,
				originTokenAddress:
					mockMappingTx.origin_token_address.toLowerCase(),
				wrappedTokenNetwork: MOCK_NETWORK_ID,
				wrappedTokenAddress:
					mockMappingTx.wrapped_token_address.toLowerCase(),
				lastUpdatedAt: expect.any(Number),
			});
		});

		test("should map multiple mapping transactions correctly", () => {
			const result = mapper.mapMappings(mockMappingTxs);

			expect(result).toHaveLength(2);

			// Test first mapping
			expect(result[0]).toEqual({
				blockNumber: mockMappingTxs[0].block_num,
				transactionIndex: mockMappingTxs[0].block_pos,
				timestamp: mockMappingTxs[0].block_timestamp,
				transactionHash: mockMappingTxs[0].tx_hash.toLowerCase(),
				originTokenNetwork: mockMappingTxs[0].origin_network,
				originTokenAddress:
					mockMappingTxs[0].origin_token_address.toLowerCase(),
				wrappedTokenNetwork: MOCK_NETWORK_ID,
				wrappedTokenAddress:
					mockMappingTxs[0].wrapped_token_address.toLowerCase(),
				lastUpdatedAt: expect.any(Number),
			});

			// Test second mapping
			expect(result[1]).toEqual({
				blockNumber: mockMappingTxs[1].block_num,
				transactionIndex: mockMappingTxs[1].block_pos,
				timestamp: mockMappingTxs[1].block_timestamp,
				transactionHash: mockMappingTxs[1].tx_hash.toLowerCase(),
				originTokenNetwork: mockMappingTxs[1].origin_network,
				originTokenAddress:
					mockMappingTxs[1].origin_token_address.toLowerCase(),
				wrappedTokenNetwork: MOCK_NETWORK_ID,
				wrappedTokenAddress:
					mockMappingTxs[1].wrapped_token_address.toLowerCase(),
				lastUpdatedAt: expect.any(Number),
			});
		});

		test("should convert transaction hash and addresses to lowercase", () => {
			const mappingWithUppercase = {
				...mockMappingTx,
				tx_hash: "0xABCDEF1234567890",
				origin_token_address:
					"0x1234567890ABCDEF1234567890ABCDEF12345678",
				wrapped_token_address:
					"0xFEDCBA0987654321FEDCBA0987654321FEDCBA09",
			};

			const result = mapper.mapMappings([mappingWithUppercase]);

			expect(result[0].transactionHash).toBe("0xabcdef1234567890");
			expect(result[0].originTokenAddress).toBe(
				"0x1234567890abcdef1234567890abcdef12345678"
			);
			expect(result[0].wrappedTokenAddress).toBe(
				"0xfedcba0987654321fedcba0987654321fedcba09"
			);
		});

		test("should set correct wrapped token network from constructor", () => {
			const differentNetworkId = 1;
			const differentMapper = new TokenMappingsMapper(differentNetworkId);

			const result = differentMapper.mapMappings([mockMappingTx]);

			expect(result[0].wrappedTokenNetwork).toBe(differentNetworkId);
		});

		test("should generate lastUpdatedAt timestamp within reasonable range", () => {
			const beforeExecution = Date.now();
			const result = mapper.mapMappings([mockMappingTx]);
			const afterExecution = Date.now();

			expect(result[0].lastUpdatedAt).toBeGreaterThanOrEqual(
				beforeExecution
			);
			expect(result[0].lastUpdatedAt).toBeLessThanOrEqual(afterExecution);
		});
	});
});
