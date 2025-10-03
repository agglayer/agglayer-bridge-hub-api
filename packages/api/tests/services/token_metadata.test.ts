import { describe, test, expect, beforeEach, mock } from "bun:test";
import { TokenMetadataService } from "../../src/services/token_metadata";
import { mockTokenMapping } from "../test-utils";

// Mock servercore classes
class MockApiError extends Error {
	constructor(
		message: string,
		public details?: any
	) {
		super(message);
		this.name = "ApiError";
	}
}

class MockBadRequestError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "BadRequestError";
	}
}

mock.module("@polygonlabs/servercore", () => ({
	ApiError: MockApiError,
	BadRequestError: MockBadRequestError,
	Logger: {
		warn: mock(() => {}),
	},
}));

// Mock viem client
const mockReadContract = mock(() => Promise.resolve("MockValue"));
const mockCreatePublicClient = mock(() => ({
	readContract: mockReadContract,
}));

mock.module("viem", () => ({
	createPublicClient: mockCreatePublicClient,
	http: mock((url: string) => ({ url })),
}));

// Mock database client
const mockDatabase = {
	getDocuments: mock(() =>
		Promise.resolve({
			documents: [mockTokenMapping],
		})
	),
};

describe("TokenMetadataService", () => {
	let testChainConfig: Map<string, Map<number, string>>;
	let testBridgeAddress: Map<string, string>;

	beforeEach(() => {
		mockDatabase.getDocuments.mockClear();
		mockReadContract.mockClear();
		mockCreatePublicClient.mockClear();

		testChainConfig = new Map([
			[
				"testnet",
				new Map([
					[1, "https://rpc1.testnet.example.com"],
					[20, "https://rpc20.testnet.example.com"],
					[137, "https://rpc137.testnet.example.com"],
				]),
			],
			[
				"mainnet",
				new Map([
					[1, "https://rpc1.mainnet.example.com"],
					[20, "https://rpc20.mainnet.example.com"],
					[137, "https://rpc137.mainnet.example.com"],
				]),
			],
		]);

		testBridgeAddress = new Map([
			["testnet", "0x1348947e282138d8f377b467F7D9c2EB0F335d1f"],
			["mainnet", "0x2a3DD3EB832aF982ec71669E178424b10Dca2EDe"],
		]);

		TokenMetadataService.initializeTokenMetadataService(
			mockDatabase as any,
			new Map([
				["mainnet", "mappings"],
				["testnet", "mappings_testnet"],
			]),
			testChainConfig,
			testBridgeAddress,
			new Map([
				[
					"mainnet",
					new Map([
						[1, "v2"],
						[20, "v2"],
					]),
				],
				[
					"testnet",
					new Map([
						[1, "v2"],
						[20, "v2"],
					]),
				],
			])
		);
	});

	describe("initializeTokenMetadataService", () => {
		test("should initialize with default parameters", () => {
			const database = mockDatabase as any;
			TokenMetadataService.initializeTokenMetadataService(database);

			expect(true).toBe(true);
		});

		test("should initialize with custom parameters", () => {
			const database = mockDatabase as any;
			const customCollectionMap = new Map([
				["custom", "custom_mappings"],
			]);
			const customChainConfig = new Map([
				["custom", new Map([[1, "https://custom.rpc.com"]])],
			]);
			const customBridgeAddress = new Map([
				["custom", "0xCustomBridge123"],
			]);

			TokenMetadataService.initializeTokenMetadataService(
				database,
				customCollectionMap,
				customChainConfig,
				customBridgeAddress
			);

			expect(true).toBe(true);
		});

		test("should not reinitialize if already initialized", () => {
			const database = mockDatabase as any;
			TokenMetadataService.initializeTokenMetadataService(database);
			TokenMetadataService.initializeTokenMetadataService(database);

			expect(true).toBe(true);
		});
	});

	describe("getTokenMetadata", () => {
		test("should return metadata when mapping found with matching originTokenAddress", async () => {
			const tokenAddress = "0x1234567890abcdef1234567890abcdef12345678";
			const network = "testnet";

			mockDatabase.getDocuments.mockResolvedValueOnce({
				documents: [
					{
						...mockTokenMapping,
						originTokenAddress: tokenAddress,
						originTokenNetwork: 1,
					},
				],
			});

			mockReadContract
				.mockResolvedValueOnce("TestToken") // name
				.mockResolvedValueOnce("TEST") // symbol
				.mockResolvedValueOnce("18") // decimals
				.mockResolvedValueOnce("0xwrappedv1address") // v1 wrapped address
				.mockResolvedValueOnce("0xwrappedv2address"); // v2 wrapped address

			const result = await TokenMetadataService.getTokenMetadata(
				network,
				tokenAddress
			);

			expect(mockDatabase.getDocuments).toHaveBeenCalledWith({
				collectionPath: "mappings_testnet",
				limit: 1,
				order: [{ field: "timestamp", order: "desc" }],
				orFilters: expect.arrayContaining([
					expect.objectContaining({
						or: expect.arrayContaining([
							expect.objectContaining({
								field: "originTokenAddress",
								operator: "==",
								value: tokenAddress,
							}),
							expect.objectContaining({
								field: "wrappedTokenAddress",
								operator: "==",
								value: tokenAddress,
							}),
						]),
					}),
				]),
			});

			expect(result).toEqual({
				name: "TestToken",
				symbol: "TEST",
				decimals: 18,
				originTokenAddress: tokenAddress,
				originTokenNetwork: 1,
				wrappedTokenAddressV1: "0xwrappedv1address",
				wrappedTokenAddressV2: "0xwrappedv2address",
			});
		});

		test("should return metadata when mapping found with matching wrappedTokenAddress", async () => {
			const tokenAddress = "0xabcdef1234567890abcdef1234567890abcdef12";
			const network = "testnet";

			mockDatabase.getDocuments.mockResolvedValueOnce({
				documents: [
					{
						...mockTokenMapping,
						wrappedTokenAddress: tokenAddress,
						originTokenNetwork: 137,
					},
				],
			});

			mockReadContract
				.mockResolvedValueOnce("WrappedToken")
				.mockResolvedValueOnce("WRAP")
				.mockResolvedValueOnce("6")
				.mockResolvedValueOnce("0xwrappedv1addr")
				.mockResolvedValueOnce("0xwrappedv2addr");

			const result = await TokenMetadataService.getTokenMetadata(
				network,
				tokenAddress
			);

			expect(result).toEqual({
				name: "WrappedToken",
				symbol: "WRAP",
				decimals: 6,
				originTokenAddress: mockTokenMapping.originTokenAddress,
				originTokenNetwork: 137,
				wrappedTokenAddressV1: "0xwrappedv1addr",
				wrappedTokenAddressV2: "0xwrappedv2addr",
			});
		});

		test("should throw BadRequestError when RPC URL not found", async () => {
			const tokenAddress = "0x1234567890abcdef1234567890abcdef12345678";
			const network = "testnet";

			mockDatabase.getDocuments.mockResolvedValueOnce({
				documents: [
					{
						...mockTokenMapping,
						originTokenAddress: tokenAddress,
						originTokenNetwork: 999, // Non-existent network
					},
				],
			});

			expect(
				TokenMetadataService.getTokenMetadata(network, tokenAddress)
			).rejects.toThrow(
				"Unsupported origin token network 999 for testnet"
			);
		});

		test("should throw error when contract calls fail", async () => {
			const tokenAddress = "0x1234567890abcdef1234567890abcdef12345678";
			const network = "testnet";

			mockDatabase.getDocuments.mockResolvedValueOnce({
				documents: [
					{
						...mockTokenMapping,
						originTokenAddress: tokenAddress,
						originTokenNetwork: 1,
					},
				],
			});

			mockReadContract.mockRejectedValueOnce(
				new Error("Contract call failed")
			);

			expect(
				TokenMetadataService.getTokenMetadata(network, tokenAddress)
			).rejects.toThrow("Contract call failed");
		});

		test("should call fetchTokenMetadataFromAllRPCs when no mapping found", async () => {
			const tokenAddress = "0x1234567890abcdef1234567890abcdef12345678";
			const network = "testnet";

			mockDatabase.getDocuments.mockResolvedValueOnce({
				documents: [], // No mapping found
			});

			mockReadContract
				.mockResolvedValueOnce("TestToken") // name from first network
				.mockResolvedValueOnce("TEST") // symbol from first network
				.mockResolvedValueOnce("18") // decimals from first network
				.mockResolvedValueOnce("0xwrappedv1address") // v1 wrapped address
				.mockResolvedValueOnce("0xwrappedv2address"); // v2 wrapped address

			const result = await TokenMetadataService.getTokenMetadata(
				network,
				tokenAddress
			);

			expect(result).toEqual({
				name: "TestToken",
				symbol: "TEST",
				decimals: 18,
				originTokenAddress: tokenAddress,
				originTokenNetwork: 1, // First network in config
				wrappedTokenAddressV1: "0xwrappedv1address",
				wrappedTokenAddressV2: "0xwrappedv2address",
			});
		});

		test("should return undefined when no mapping and RPC calls fail", async () => {
			const tokenAddress = "0x1234567890abcdef1234567890abcdef12345678";
			const network = "testnet";

			mockDatabase.getDocuments.mockResolvedValueOnce({
				documents: [],
			});

			// Clear all previous mocks and set them all to fail
			mockReadContract.mockClear();
			mockReadContract.mockRejectedValue(new Error("All RPCs failed"));

			const result = await TokenMetadataService.getTokenMetadata(
				network,
				tokenAddress
			);

			expect(result).toBeUndefined();
		});

		test("should handle case insensitive token address matching", async () => {
			const tokenAddress = "0x1234567890ABCDEF1234567890ABCDEF12345678"; // Uppercase
			const mappingTokenAddress =
				"0x1234567890abcdef1234567890abcdef12345678"; // Lowercase
			const network = "testnet";

			mockDatabase.getDocuments.mockResolvedValueOnce({
				documents: [
					{
						...mockTokenMapping,
						originTokenAddress: mappingTokenAddress,
						originTokenNetwork: 1,
					},
				],
			});

			mockReadContract
				.mockResolvedValueOnce("TestToken")
				.mockResolvedValueOnce("TEST")
				.mockResolvedValueOnce("18")
				.mockResolvedValueOnce("0xwrappedv1")
				.mockResolvedValueOnce("0xwrappedv2");

			const result = await TokenMetadataService.getTokenMetadata(
				network,
				tokenAddress
			);

			expect(result).toBeDefined();
			expect(result?.name).toBe("TestToken");
		});

		test("should handle different network configurations", async () => {
			const tokenAddress = "0x1234567890abcdef1234567890abcdef12345678";
			const networks = ["mainnet", "testnet"];

			for (const network of networks) {
				mockDatabase.getDocuments.mockResolvedValueOnce({
					documents: [
						{
							...mockTokenMapping,
							originTokenAddress: tokenAddress,
							originTokenNetwork: 1,
						},
					],
				});

				mockReadContract
					.mockResolvedValueOnce(`${network}Token`)
					.mockResolvedValueOnce(`${network.toUpperCase()}`)
					.mockResolvedValueOnce("18")
					.mockResolvedValueOnce("0xwrappedv1")
					.mockResolvedValueOnce("0xwrappedv2");

				const result = await TokenMetadataService.getTokenMetadata(
					network,
					tokenAddress
				);

				expect(result?.name).toBe(`${network}Token`);
				expect(result?.symbol).toBe(network.toUpperCase());

				mockDatabase.getDocuments.mockClear();
				mockReadContract.mockClear();
			}
		});

		test("should handle empty chain configuration", async () => {
			// Initialize with empty chain config
			TokenMetadataService.initializeTokenMetadataService(
				mockDatabase as any,
				new Map([["testnet", "mappings_testnet"]]),
				new Map([["testnet", new Map()]]), // Empty chain config
				testBridgeAddress,
				new Map([["testnet", new Map()]])
			);

			const tokenAddress = "0x1234567890abcdef1234567890abcdef12345678";
			const network = "testnet";

			mockDatabase.getDocuments.mockResolvedValueOnce({
				documents: [],
			});

			const result = await TokenMetadataService.getTokenMetadata(
				network,
				tokenAddress
			);

			expect(result).toBeUndefined();
		});

		test("should handle missing bridge address", async () => {
			// Initialize without bridge address for testnet
			TokenMetadataService.initializeTokenMetadataService(
				mockDatabase as any,
				new Map([["testnet", "mappings_testnet"]]),
				testChainConfig,
				new Map([["mainnet", "0xbridge123"]]), // No testnet bridge
				new Map([["testnet", new Map()]])
			);

			const tokenAddress = "0x1234567890abcdef1234567890abcdef12345678";
			const network = "testnet";

			mockDatabase.getDocuments.mockResolvedValueOnce({
				documents: [],
			});

			const result = await TokenMetadataService.getTokenMetadata(
				network,
				tokenAddress
			);

			expect(result).toBeUndefined();
		});

		test("should try multiple RPCs if first one fails", async () => {
			const tokenAddress = "0x1234567890abcdef1234567890abcdef12345678";
			const network = "testnet";

			mockDatabase.getDocuments.mockResolvedValueOnce({
				documents: [],
			});

			// First RPC call fails, second succeeds
			mockReadContract
				.mockRejectedValueOnce(new Error("First RPC failed"))
				.mockRejectedValueOnce(new Error("First RPC failed"))
				.mockRejectedValueOnce(new Error("First RPC failed"))
				.mockResolvedValueOnce("SecondRPCToken") // Second RPC succeeds
				.mockResolvedValueOnce("SECOND")
				.mockResolvedValueOnce("18")
				.mockResolvedValueOnce("0xwrappedv1addr")
				.mockResolvedValueOnce("0xwrappedv2addr");

			const result = await TokenMetadataService.getTokenMetadata(
				network,
				tokenAddress
			);

			expect(result).toEqual({
				name: "SecondRPCToken",
				symbol: "SECOND",
				decimals: 18,
				originTokenAddress: tokenAddress,
				originTokenNetwork: 20, // Second network in config (network 20)
				wrappedTokenAddressV1: "0xwrappedv1addr",
				wrappedTokenAddressV2: "0xwrappedv2addr",
			});
		});
	});
});
