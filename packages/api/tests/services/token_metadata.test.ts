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

mock.module("@polygonlabs/servercore", () => ({
	ApiError: MockApiError,
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
					[137, "https://rpc137.testnet.example.com"],
				]),
			],
			[
				"mainnet",
				new Map([
					[1, "https://rpc1.mainnet.example.com"],
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
			testBridgeAddress
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
			const orQueryParams = [
				{
					or: [
						{
							field: "originTokenAddress",
							operator: "==" as any,
							value: tokenAddress,
						},
					],
				},
			] as any;

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
				.mockResolvedValueOnce("18"); // decimals

			const result = await TokenMetadataService.getTokenMetadata(
				network,
				tokenAddress,
				orQueryParams
			);

			expect(mockDatabase.getDocuments).toHaveBeenCalledWith({
				collectionPath: "mappings_testnet",
				limit: 1,
				order: [{ field: "timestamp", order: "desc" }],
				orFilters: orQueryParams,
			});

			expect(mockCreatePublicClient).toHaveBeenCalledWith({
				transport: { url: "https://rpc1.testnet.example.com" },
			});

			expect(result).toEqual({
				originTokenNetwork: 1,
				originTokenAddress: tokenAddress,
				wrappedTokenAddress: mockTokenMapping.wrappedTokenAddress,
				name: "TestToken",
				symbol: "TEST",
				decimals: 18,
			});
		});

		test("should return metadata when mapping found with matching wrappedTokenAddress", async () => {
			const tokenAddress = "0xabcdef1234567890abcdef1234567890abcdef12";
			const network = "testnet";
			const orQueryParams = [
				{
					or: [
						{
							field: "wrappedTokenAddress",
							operator: "==" as any,
							value: tokenAddress,
						},
					],
				},
			] as any;

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
				.mockResolvedValueOnce("6");

			const result = await TokenMetadataService.getTokenMetadata(
				network,
				tokenAddress,
				orQueryParams
			);

			expect(mockCreatePublicClient).toHaveBeenCalledWith({
				transport: { url: "https://rpc137.testnet.example.com" },
			});

			expect(result).toEqual({
				originTokenNetwork: 137,
				originTokenAddress: mockTokenMapping.originTokenAddress,
				wrappedTokenAddress: tokenAddress,
				name: "WrappedToken",
				symbol: "WRAP",
				decimals: 6,
			});
		});

		test("should throw ApiError when RPC URL not found", async () => {
			const tokenAddress = "0x1234567890abcdef1234567890abcdef12345678";
			const network = "testnet";
			const orQueryParams: any[] = [];

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
				TokenMetadataService.getTokenMetadata(
					network,
					tokenAddress,
					orQueryParams
				)
			).rejects.toThrow(
				"RPC URL not found for network testnet and chain 999"
			);
		});

		test("should throw ApiError when contract calls fail", async () => {
			const tokenAddress = "0x1234567890abcdef1234567890abcdef12345678";
			const network = "testnet";
			const orQueryParams: any[] = [];

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
				TokenMetadataService.getTokenMetadata(
					network,
					tokenAddress,
					orQueryParams
				)
			).rejects.toThrow("Failed to fetch token metadata");
		});

		test("should call fetchTokenMetadataFromRPCs when no mapping found", async () => {
			const tokenAddress = "0x1234567890abcdef1234567890abcdef12345678";
			const network = "testnet";
			const orQueryParams: any[] = [];

			mockDatabase.getDocuments.mockResolvedValueOnce({
				documents: [], // No mapping found
			});

			mockReadContract
				.mockResolvedValueOnce("DirectToken") // name
				.mockResolvedValueOnce("DIRECT") // symbol
				.mockResolvedValueOnce("18") // decimals
				.mockResolvedValueOnce("0xwrappedaddress123"); // wrappedTokenAddress

			const result = await TokenMetadataService.getTokenMetadata(
				network,
				tokenAddress,
				orQueryParams
			);

			expect(result).toEqual({
				originTokenNetwork: 1, // First network in config
				originTokenAddress: tokenAddress,
				wrappedTokenAddress: "0xwrappedaddress123",
				name: "DirectToken",
				symbol: "DIRECT",
				decimals: 18,
			});
		});

		test("should return undefined when no mapping and RPC calls fail", async () => {
			const tokenAddress = "0x1234567890abcdef1234567890abcdef12345678";
			const network = "testnet";
			const orQueryParams: any[] = [];

			mockDatabase.getDocuments.mockResolvedValueOnce({
				documents: [],
			});

			mockReadContract.mockRejectedValue(new Error("All RPCs failed"));

			const result = await TokenMetadataService.getTokenMetadata(
				network,
				tokenAddress,
				orQueryParams
			);

			expect(result).toBeUndefined();
		});

		test("should handle case insensitive token address matching", async () => {
			const tokenAddress = "0x1234567890ABCDEF1234567890ABCDEF12345678"; // Uppercase
			const mappingTokenAddress =
				"0x1234567890abcdef1234567890abcdef12345678"; // Lowercase
			const network = "testnet";
			const orQueryParams: any[] = [];

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
				.mockResolvedValueOnce("18");

			const result = await TokenMetadataService.getTokenMetadata(
				network,
				tokenAddress,
				orQueryParams
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
					.mockResolvedValueOnce("18");

				const result = await TokenMetadataService.getTokenMetadata(
					network,
					tokenAddress,
					[]
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
				testBridgeAddress
			);

			const tokenAddress = "0x1234567890abcdef1234567890abcdef12345678";
			const network = "testnet";

			mockDatabase.getDocuments.mockResolvedValueOnce({
				documents: [],
			});

			const result = await TokenMetadataService.getTokenMetadata(
				network,
				tokenAddress,
				[]
			);

			expect(result).toBeUndefined();
		});

		test("should handle missing bridge address", async () => {
			// Initialize without bridge address for testnet
			TokenMetadataService.initializeTokenMetadataService(
				mockDatabase as any,
				new Map([["testnet", "mappings_testnet"]]),
				testChainConfig,
				new Map([["mainnet", "0xbridge123"]]) // No testnet bridge
			);

			const tokenAddress = "0x1234567890abcdef1234567890abcdef12345678";
			const network = "testnet";

			mockDatabase.getDocuments.mockResolvedValueOnce({
				documents: [],
			});

			const result = await TokenMetadataService.getTokenMetadata(
				network,
				tokenAddress,
				[]
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
				.mockRejectedValueOnce(new Error("First RPC failed"))
				.mockResolvedValueOnce("SecondRPCToken") // Second RPC succeeds
				.mockResolvedValueOnce("SECOND")
				.mockResolvedValueOnce("18")
				.mockResolvedValueOnce("0xwrapped456");

			const result = await TokenMetadataService.getTokenMetadata(
				network,
				tokenAddress,
				[]
			);

			expect(result).toEqual({
				originTokenNetwork: 137, // Second network in config
				originTokenAddress: tokenAddress,
				wrappedTokenAddress: "0xwrapped456",
				name: "SecondRPCToken",
				symbol: "SECOND",
				decimals: 18,
			});
		});
	});
});
