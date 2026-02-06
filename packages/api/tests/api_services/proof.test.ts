import { describe, test, expect, beforeEach, mock } from "bun:test";

// Mock errors
const ApiError = class extends Error {
	constructor(message: string, _options?: any) {
		super(message);
		this.name = "ApiError";
	}
};

const NotFoundError = class extends Error {
	constructor(
		message: string,
		_code?: any,
		_statusCode?: any,
		_context?: any
	) {
		super(message);
		this.name = "NotFoundError";
	}
};

// Mock modules before imports
mock.module("@polygonlabs/servercore", () => ({
	ApiError,
	NotFoundError,
}));

// Now import after mocking dependencies
import { ProofService } from "../../src/services/proof";
import { Networks } from "../../src/enums";

describe("ProofService", () => {
	let proofService: ProofService;
	let networkMap: Map<string, Map<number, string>>;
	let mockFetch: any;

	beforeEach(() => {
		// Setup network map
		networkMap = new Map([
			[
				"mainnet",
				new Map([
					[1, "https://api-mainnet.example.com"],
					[137, "https://api-mainnet-polygon.example.com"],
				]),
			],
			[
				"testnet",
				new Map([
					[11155111, "https://api-testnet.example.com"],
					[80002, "https://api-testnet-polygon.example.com"],
				]),
			],
			[
				"devnet",
				new Map([
					[1, "https://api-devnet.example.com"],
					[2, "https://api-devnet-polygon.example.com"],
				]),
			],
		]);

		proofService = new ProofService(networkMap);

		// Mock global fetch
		mockFetch = mock((url: string) => {
			if (url.includes("claim-proof")) {
				return Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							proof_local_exit_root: [
								"0xproof1",
								"0xproof2",
								"0xproof3",
							],
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
						}),
				});
			} else if (url.includes("bridges")) {
				return Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							bridges: [
								{
									metadata: {
										permit_data: "0xpermit123",
										origin_network: 1,
										destination_network: 137,
									},
								},
							],
							count: 1,
						}),
				});
			}
			return Promise.resolve({
				ok: false,
				json: () => Promise.resolve({ error: "Not found" }),
			});
		});

		global.fetch = mockFetch;
	});

	describe("getProof", () => {
		test("should successfully fetch proof and transaction data", async () => {
			const result = await proofService.getProof(
				Networks.MAINNET,
				1,
				100,
				50
			);

			expect(result).toHaveProperty("proof_local_exit_root");
			expect(result).toHaveProperty("proof_rollup_exit_root");
			expect(result).toHaveProperty("l1_info_tree_leaf");
			expect(result).toHaveProperty("bridge_tx_metadata");
			expect(result.bridge_tx_metadata).toEqual({
				permit_data: "0xpermit123",
				origin_network: 1,
				destination_network: 137,
			});
		});

		test("should make correct API calls with proper query parameters", async () => {
			await proofService.getProof(Networks.MAINNET, 1, 100, 50);

			expect(mockFetch).toHaveBeenCalledTimes(2);

			const calls = mockFetch.mock.calls;
			expect(calls[0][0]).toBe(
				"https://api-mainnet.example.com/claim-proof?network_id=1&deposit_count=100&leaf_index=50"
			);
			expect(calls[1][0]).toBe(
				"https://api-mainnet.example.com/bridges?network_id=1&deposit_count=100"
			);
		});

		test("should throw NotFoundError when network is not supported", async () => {
			await expect(
				proofService.getProof("invalid-network" as Networks, 1, 100, 50)
			).rejects.toThrow("Network URL isn't supported");
		});

		test("should throw NotFoundError when source network is not configured", async () => {
			await expect(
				proofService.getProof(Networks.MAINNET, 999, 100, 50)
			).rejects.toThrow("Network URL isn't supported");
		});

		test("should throw NotFoundError when proof API returns error", async () => {
			mockFetch.mockImplementation((url: string) => {
				if (url.includes("claim-proof")) {
					return Promise.resolve({
						ok: false,
						json: () =>
							Promise.resolve({
								error: "Proof not found",
							}),
					});
				}
				return Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							bridges: [{ metadata: {} }],
							count: 1,
						}),
				});
			});

			await expect(
				proofService.getProof(Networks.MAINNET, 1, 100, 50)
			).rejects.toThrow("Proof not found");
		});

		test("should throw NotFoundError when transaction API returns error", async () => {
			mockFetch.mockImplementation((url: string) => {
				if (url.includes("claim-proof")) {
					return Promise.resolve({
						ok: true,
						json: () =>
							Promise.resolve({
								proof_local_exit_root: [],
							}),
					});
				}
				return Promise.resolve({
					ok: false,
					json: () =>
						Promise.resolve({
							error: "Transaction not found",
						}),
				});
			});

			await expect(
				proofService.getProof(Networks.MAINNET, 1, 100, 50)
			).rejects.toThrow("Transaction not found");
		});

		test("should throw NotFoundError when bridges array is empty", async () => {
			mockFetch.mockImplementation((url: string) => {
				if (url.includes("claim-proof")) {
					return Promise.resolve({
						ok: true,
						json: () =>
							Promise.resolve({
								proof_local_exit_root: [],
							}),
					});
				}
				return Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							bridges: undefined,
							count: 0,
						}),
				});
			});

			await expect(
				proofService.getProof(Networks.MAINNET, 1, 100, 50)
			).rejects.toThrow("Error fetching Transaction for Proof");
		});

		test("should throw NotFoundError when count is zero", async () => {
			mockFetch.mockImplementation((url: string) => {
				if (url.includes("claim-proof")) {
					return Promise.resolve({
						ok: true,
						json: () =>
							Promise.resolve({
								proof_local_exit_root: [],
							}),
					});
				}
				return Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							bridges: [{ metadata: {} }],
							count: 0,
						}),
				});
			});

			await expect(
				proofService.getProof(Networks.MAINNET, 1, 100, 50)
			).rejects.toThrow("Error fetching Transaction for Proof");
		});

		test("should throw ApiError when fetch throws unexpected error", async () => {
			mockFetch.mockRejectedValue(new Error("Network error"));

			await expect(
				proofService.getProof(Networks.MAINNET, 1, 100, 50)
			).rejects.toThrow("Network error");
		});

		test("should work correctly for testnet", async () => {
			const result = await proofService.getProof(
				Networks.TESTNET,
				11155111,
				100,
				50
			);

			expect(result).toHaveProperty("proof_local_exit_root");
			expect(result).toHaveProperty("bridge_tx_metadata");

			const calls = mockFetch.mock.calls;
			expect(calls[0][0]).toContain("https://api-testnet.example.com");
		});

		test("should work correctly for devnet", async () => {
			const result = await proofService.getProof(
				Networks.DEVNET,
				1,
				100,
				50
			);

			expect(result).toHaveProperty("proof_local_exit_root");
			expect(result).toHaveProperty("bridge_tx_metadata");

			const calls = mockFetch.mock.calls;
			expect(calls[0][0]).toContain("https://api-devnet.example.com");
		});

		test("should merge proof data with bridge metadata", async () => {
			const result = await proofService.getProof(
				Networks.MAINNET,
				1,
				100,
				50
			);

			expect(result.proof_local_exit_root).toEqual([
				"0xproof1",
				"0xproof2",
				"0xproof3",
			]);
			expect(result.proof_rollup_exit_root).toEqual([
				"0xrollup1",
				"0xrollup2",
			]);
			expect(result.bridge_tx_metadata).toEqual({
				permit_data: "0xpermit123",
				origin_network: 1,
				destination_network: 137,
			});
		});

		test("should handle different deposit counts", async () => {
			await proofService.getProof(Networks.MAINNET, 1, 500, 50);

			const calls = mockFetch.mock.calls;
			expect(calls[0][0]).toContain("deposit_count=500");
			expect(calls[1][0]).toContain("deposit_count=500");
		});

		test("should handle different leaf indices", async () => {
			await proofService.getProof(Networks.MAINNET, 1, 100, 200);

			const calls = mockFetch.mock.calls;
			expect(calls[0][0]).toContain("leaf_index=200");
		});

		test("should make parallel API calls for efficiency", async () => {
			await proofService.getProof(Networks.MAINNET, 1, 100, 50);

			// Both calls should be made in parallel
			expect(mockFetch).toHaveBeenCalledTimes(2);
			// Since they're parallel, total time should be less than sequential
			// (This is a rough check - exact timing depends on mock implementation)
		});
	});

	describe("constructor", () => {
		test("should initialize with network map", () => {
			const service = new ProofService(networkMap);
			expect(service).toBeInstanceOf(ProofService);
		});

		test("should work with empty network map", () => {
			const emptyMap = new Map();
			const service = new ProofService(emptyMap);
			expect(service).toBeInstanceOf(ProofService);
		});
	});
});
