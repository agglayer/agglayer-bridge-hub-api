import { describe, test, expect, beforeEach } from "bun:test";
import MetadataMapper from "../../src/mappers/metadata";
import {
	mockLastIndexedBridgeTransaction,
	mockLastIndexedClaimTransaction,
	mockLastIndexedMappingTransaction,
} from "../test-utils";

describe("MetadataMapper", () => {
	let mapper: MetadataMapper;

	beforeEach(() => {
		mapper = new MetadataMapper();
	});

	describe("constructor", () => {
		test("should initialize without parameters", () => {
			const testMapper = new MetadataMapper();
			expect(testMapper).toBeInstanceOf(MetadataMapper);
		});
	});

	describe("mapLastIndexedBridgeTx", () => {
		test("should map last indexed bridge transaction correctly", () => {
			const result = mapper.mapLastIndexedBridgeTx(
				mockLastIndexedBridgeTransaction
			);

			expect(result).toEqual({
				lastIndexedBridgeDepositCount:
					mockLastIndexedBridgeTransaction.deposit_count,
			});
		});

		test("should map different deposit counts correctly", () => {
			const customBridgeTransaction = { deposit_count: 999 };
			const result = mapper.mapLastIndexedBridgeTx(
				customBridgeTransaction
			);

			expect(result).toEqual({
				lastIndexedBridgeDepositCount: 999,
			});
		});

		test("should map zero deposit count correctly", () => {
			const zeroBridgeTransaction = { deposit_count: 0 };
			const result = mapper.mapLastIndexedBridgeTx(zeroBridgeTransaction);

			expect(result).toEqual({
				lastIndexedBridgeDepositCount: 0,
			});
		});
	});

	describe("mapLastIndexedClaimTx", () => {
		test("should map last indexed claim transaction correctly", () => {
			const result = mapper.mapLastIndexedClaimTx(
				mockLastIndexedClaimTransaction
			);

			expect(result).toEqual({
				lastIndexedClaimBlockNumber:
					mockLastIndexedClaimTransaction.block_num,
			});
		});

		test("should map different block numbers correctly", () => {
			const customClaimTransaction = { block_num: 123456 };
			const result = mapper.mapLastIndexedClaimTx(customClaimTransaction);

			expect(result).toEqual({
				lastIndexedClaimBlockNumber: 123456,
			});
		});

		test("should map zero block number correctly", () => {
			const zeroClaimTransaction = { block_num: 0 };
			const result = mapper.mapLastIndexedClaimTx(zeroClaimTransaction);

			expect(result).toEqual({
				lastIndexedClaimBlockNumber: 0,
			});
		});
	});

	describe("mapLastIndexedMappingTx", () => {
		test("should map last indexed mapping transaction correctly", () => {
			const result = mapper.mapLastIndexedMappingTx(
				mockLastIndexedMappingTransaction
			);

			expect(result).toEqual({
				lastIndexedMappingBlockNumber:
					mockLastIndexedMappingTransaction.block_num,
			});
		});

		test("should map different block numbers correctly", () => {
			const customMappingTransaction = { block_num: 789012 };
			const result = mapper.mapLastIndexedMappingTx(
				customMappingTransaction
			);

			expect(result).toEqual({
				lastIndexedMappingBlockNumber: 789012,
			});
		});

		test("should map zero block number correctly", () => {
			const zeroMappingTransaction = { block_num: 0 };
			const result = mapper.mapLastIndexedMappingTx(
				zeroMappingTransaction
			);

			expect(result).toEqual({
				lastIndexedMappingBlockNumber: 0,
			});
		});
	});

	describe("return type consistency", () => {
		test("all mapping methods should return objects with single property", () => {
			const bridgeResult = mapper.mapLastIndexedBridgeTx(
				mockLastIndexedBridgeTransaction
			);
			const claimResult = mapper.mapLastIndexedClaimTx(
				mockLastIndexedClaimTransaction
			);
			const mappingResult = mapper.mapLastIndexedMappingTx(
				mockLastIndexedMappingTransaction
			);

			expect(Object.keys(bridgeResult)).toHaveLength(1);
			expect(Object.keys(claimResult)).toHaveLength(1);
			expect(Object.keys(mappingResult)).toHaveLength(1);

			expect(bridgeResult).toHaveProperty(
				"lastIndexedBridgeDepositCount"
			);
			expect(claimResult).toHaveProperty("lastIndexedClaimBlockNumber");
			expect(mappingResult).toHaveProperty(
				"lastIndexedMappingBlockNumber"
			);
		});

		test("should handle large numbers correctly", () => {
			const largeNumber = Number.MAX_SAFE_INTEGER;

			const bridgeResult = mapper.mapLastIndexedBridgeTx({
				deposit_count: largeNumber,
			});
			const claimResult = mapper.mapLastIndexedClaimTx({
				block_num: largeNumber,
			});
			const mappingResult = mapper.mapLastIndexedMappingTx({
				block_num: largeNumber,
			});

			expect(bridgeResult.lastIndexedBridgeDepositCount).toBe(
				largeNumber
			);
			expect(claimResult.lastIndexedClaimBlockNumber).toBe(largeNumber);
			expect(mappingResult.lastIndexedMappingBlockNumber).toBe(
				largeNumber
			);
		});
	});
});
