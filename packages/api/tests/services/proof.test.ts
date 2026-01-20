import { describe, test, expect, beforeEach, mock } from "bun:test";
import { ProofService } from "../../src/services/proof";
import { mockProof } from "../test-utils";

// Mock global fetch
const mockFetch = mock(() =>
	Promise.resolve({
		ok: true,
		json: () => Promise.resolve(mockProof),
	})
);

// Mock servercore error classes
class MockNotFoundError extends Error {
	constructor(
		message: string,
		public details?: any,
		public statusCode?: number,
		public context?: any
	) {
		super(message);
		this.name = "NotFoundError";
	}
}

class MockApiError extends Error {
	constructor(
		message: string,
		public details?: any
	) {
		super(message);
		this.name = "ApiError";
	}
}

// Mock the modules
mock.module("@polygonlabs/servercore", () => ({
	NotFoundError: MockNotFoundError,
	ApiError: MockApiError,
}));

// Set up global fetch mock
global.fetch = mockFetch as any;

describe("ProofService", () => {
	let testNetworkMap: Map<string, Map<number, string>>;
	let proofService: ProofService;

	beforeEach(() => {
		mockFetch.mockClear();

		// Set up test network configuration
		testNetworkMap = new Map([
			[
				"testnet",
				new Map([
					[1, "https://rpc1.testnet.example.com/claim-proof"],
					[137, "https://rpc137.testnet.example.com/claim-proof"],
				]),
			],
			[
				"mainnet",
				new Map([
					[1, "https://rpc1.mainnet.example.com/claim-proof"],
					[137, "https://rpc137.mainnet.example.com/claim-proof"],
				]),
			],
		]);

		// Create a new service instance for each test
		proofService = new ProofService(testNetworkMap);
	});

	describe("constructor", () => {
		test("should create instance successfully", () => {
			// Create an instance to verify constructor works
			const service = new ProofService(testNetworkMap);

			expect(service).toBeDefined();

			// Also verify custom maps can be passed
			const customMap = new Map([
				[
					"custom",
					new Map([[42, "https://custom.rpc.com/claim-proof"]]),
				],
			]);
			const customService = new ProofService(customMap);
			expect(customService).toBeDefined();
		});
	});

	describe("getProof", () => {
		test("should build correct URL and fetch proof", async () => {
			const network = "testnet";
			const sourceNetwork = 1;
			const depositCount = 42;
			const leaf = 100;

			const result = await proofService.getProof(
				network,
				sourceNetwork,
				depositCount,
				leaf
			);

			const expectedUrl =
				"https://rpc1.testnet.example.com/claim-proof?network_id=1&deposit_count=42&leaf_index=100";

			expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
			expect(result).toBe(mockProof);
		});

		test("should handle different network and source network combinations", async () => {
			const testCases = [
				{
					network: "testnet",
					sourceNetwork: 137,
					expectedBaseUrl:
						"https://rpc137.testnet.example.com/claim-proof",
				},
				{
					network: "mainnet",
					sourceNetwork: 1,
					expectedBaseUrl:
						"https://rpc1.mainnet.example.com/claim-proof",
				},
				{
					network: "mainnet",
					sourceNetwork: 137,
					expectedBaseUrl:
						"https://rpc137.mainnet.example.com/claim-proof",
				},
			];

			for (const {
				network,
				sourceNetwork,
				expectedBaseUrl,
			} of testCases) {
				const depositCount = 42;
				const leaf = 100;

				await proofService.getProof(
					network,
					sourceNetwork,
					depositCount,
					leaf
				);

				const expectedUrl = `${expectedBaseUrl}?network_id=${sourceNetwork}&deposit_count=${depositCount}&leaf_index=${leaf}`;
				expect(mockFetch).toHaveBeenCalledWith(expectedUrl);

				mockFetch.mockClear();
			}
		});

		test("should handle various parameter values", async () => {
			const testCases = [
				{ depositCount: 0, leaf: 0 },
				{ depositCount: 999999, leaf: 500000 },
				{ depositCount: 1, leaf: 1 },
			];

			for (const { depositCount, leaf } of testCases) {
				await proofService.getProof("testnet", 1, depositCount, leaf);

				const expectedUrl = `https://rpc1.testnet.example.com/claim-proof?network_id=1&deposit_count=${depositCount}&leaf_index=${leaf}`;
				expect(mockFetch).toHaveBeenCalledWith(expectedUrl);

				mockFetch.mockClear();
			}
		});

		test("should return proof data from successful response", async () => {
			const customProof = {
				proof_local_exit_root: ["0xcustom1", "0xcustom2"],
				proof_rollup_exit_root: ["0xrollup1"],
				l1_info_tree_leaf: {
					block_num: 54321,
					block_pos: 2,
					l1_info_tree_index: 100,
					previous_block_hash: "0xcustomprevious",
					timestamp: 1700001000,
					mainnet_exit_root: "0xmainroot",
					rollup_exit_root: "0xrolluproot",
					global_exit_root: "0xcustomglobal",
					hash: "0xcustomhash",
				},
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(customProof),
			});

			const result = await proofService.getProof("testnet", 1, 42, 100);

			expect(result).toBe(customProof);
		});
	});

	describe("error handling", () => {
		test("should throw NotFoundError when network is not supported", async () => {
			const unsupportedNetwork = "unsupported";

			expect(
				proofService.getProof(unsupportedNetwork, 1, 42, 100)
			).rejects.toThrow("Network URL isn't supported");

			expect(mockFetch).not.toHaveBeenCalled();
		});

		test("should throw NotFoundError when source network is not configured", async () => {
			const network = "testnet";
			const unsupportedSourceNetwork = 999; // Not in the test config

			expect(
				proofService.getProof(
					network,
					unsupportedSourceNetwork,
					42,
					100
				)
			).rejects.toThrow("Network URL isn't supported");

			expect(mockFetch).not.toHaveBeenCalled();
		});

		test("should throw NotFoundError when HTTP response is not ok", async () => {
			const errorResponse = {
				error: "Proof not found for given parameters",
			};

			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: () => Promise.resolve(errorResponse as any),
			});

			expect(
				proofService.getProof("testnet", 1, 42, 100)
			).rejects.toThrow("Proof not found for given parameters");
		});

		test("should throw NotFoundError with default message when error response has no error field", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: () => Promise.resolve({} as any),
			});

			expect(
				proofService.getProof("testnet", 1, 42, 100)
			).rejects.toThrow("Error fetching Proof");
		});

		test("should throw ApiError when fetch throws an error", async () => {
			const fetchError = new Error("Network connection failed");
			mockFetch.mockRejectedValueOnce(fetchError);

			expect(
				proofService.getProof("testnet", 1, 42, 100)
			).rejects.toThrow("Network connection failed");
		});

		test("should throw ApiError with default message for non-Error exceptions", async () => {
			mockFetch.mockRejectedValueOnce("String error");

			expect(
				proofService.getProof("testnet", 1, 42, 100)
			).rejects.toThrow("Error fetching Proof");
		});

		test("should re-throw NotFoundError without wrapping", async () => {
			const notFoundError = new MockNotFoundError(
				"Custom not found error"
			);
			mockFetch.mockRejectedValueOnce(notFoundError);

			expect(
				proofService.getProof("testnet", 1, 42, 100)
			).rejects.toThrow("Custom not found error");
		});

		test("should include context information in NotFoundError for unsupported network", async () => {
			try {
				await proofService.getProof("unsupported", 1, 42, 100);
				expect(false).toBe(true); // Should not reach here
			} catch (error) {
				expect(error).toBeInstanceOf(MockNotFoundError);
				expect((error as any).context).toBeDefined();
				expect((error as any).context).toEqual({
					network: "unsupported",
					sourceNetwork: 1,
					depositCount: 42,
					leaf: 100,
				});
			}
		});

		test("should include context information in NotFoundError for HTTP errors", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: () => Promise.resolve({ error: "HTTP error" } as any),
			});

			try {
				await proofService.getProof("testnet", 1, 42, 100);
				expect(false).toBe(true); // Should not reach here
			} catch (error) {
				expect(error).toBeInstanceOf(MockNotFoundError);
				expect((error as any).context).toBeDefined();
				expect((error as any).context.url).toBe(
					"https://rpc1.testnet.example.com/claim-proof?network_id=1&deposit_count=42&leaf_index=100"
				);
			}
		});

		test("should include context information in ApiError for fetch errors", async () => {
			mockFetch.mockRejectedValueOnce(new Error("Fetch failed"));

			try {
				await proofService.getProof("testnet", 1, 42, 100);
				expect(false).toBe(true); // Should not reach here
			} catch (error) {
				expect(error).toBeInstanceOf(MockApiError);
				expect((error as any).details.context).toBeDefined();
				expect((error as any).details.context.url).toBe(
					"https://rpc1.testnet.example.com/claim-proof"
				);
			}
		});
	});

	describe("URL construction", () => {
		test("should construct URL with correct query parameters", async () => {
			await proofService.getProof("testnet", 1, 42, 100);

			const calledUrl = (mockFetch.mock.calls as any)[0][0];
			const url = new URL(calledUrl);

			expect(url.origin).toBe("https://rpc1.testnet.example.com");
			expect(url.pathname).toBe("/claim-proof");
			expect(url.searchParams.get("network_id")).toBe("1");
			expect(url.searchParams.get("deposit_count")).toBe("42");
			expect(url.searchParams.get("leaf_index")).toBe("100");
		});

		test("should handle special characters in URL construction", async () => {
			await proofService.getProof("testnet", 1, 42, 100);

			const calledUrl = (mockFetch.mock.calls as any)[0][0];

			// URL should be properly encoded
			expect(calledUrl).toContain("network_id=1");
			expect(calledUrl).toContain("deposit_count=42");
			expect(calledUrl).toContain("leaf_index=100");
		});
	});

	describe("edge cases", () => {
		test("should handle zero values in parameters", async () => {
			await proofService.getProof("testnet", 1, 0, 0);

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining(
					"network_id=1&deposit_count=0&leaf_index=0"
				)
			);
		});

		test("should handle large numeric values", async () => {
			const largeValue = Number.MAX_SAFE_INTEGER;
			await proofService.getProof("testnet", 1, largeValue, largeValue);

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining(
					`deposit_count=${largeValue}&leaf_index=${largeValue}`
				)
			);
		});

		test("should handle negative values", async () => {
			await proofService.getProof("testnet", 1, -1, -1);

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("deposit_count=-1&leaf_index=-1")
			);
		});
	});
});
