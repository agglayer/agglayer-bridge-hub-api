import { describe, test, expect, beforeEach, mock } from "bun:test";

// Mock errors
const ApiError = class extends Error {
	constructor(message: string, _options?: any) {
		super(message);
		this.name = "ApiError";
	}
};

const BadRequestError = class extends Error {
	constructor(message: string) {
		super(message);
		this.name = "BadRequestError";
	}
};

// Mock servercore-mongo
const mockExecuteMongoOperation = mock(async (collection: any, fn: any) => {
	return fn(collection);
});

// Mock viem
const mockReadContract = mock(async ({ functionName }: any) => {
	if (functionName === "name") return "Test Token";
	if (functionName === "symbol") return "TEST";
	if (functionName === "decimals") return 18;
	if (functionName === "precalculatedWrapperAddress")
		return "0xWRAPPEDV1ADDRESS";
	if (functionName === "computeTokenProxyAddress")
		return "0xWRAPPEDV2ADDRESS";
	return undefined;
});

const mockCreatePublicClient = mock(() => ({
	readContract: mockReadContract,
}));

// Mock modules before imports
mock.module("@polygonlabs/servercore", () => ({
	ApiError,
	BadRequestError,
	Logger: {
		warn: mock(() => {}),
		create: mock(() => {}),
		info: mock(() => {}),
		error: mock(() => {}),
		debug: mock(() => {}),
	},
}));

mock.module("@polygonlabs/servercore-mongo", () => ({
	executeMongoOperation: mockExecuteMongoOperation,
}));

mock.module("viem", () => ({
	createPublicClient: mockCreatePublicClient,
	http: (url: string) => ({ url }),
}));

// Now import after mocking dependencies
import { TokenMetadataService } from "../../src/services/token_metadata";
import { Networks } from "../../src/enums";

describe("TokenMetadataService", () => {
	let tokenMetadataService: TokenMetadataService;
	let mockDb: any;
	let mockCollection: any;
	let collectionId: Map<string, string>;
	let chainConfig: Map<string, Map<number, string>>;
	let bridgeAddress: Map<string, string>;

	beforeEach(() => {
		// Clear all mocks
		mockReadContract.mockClear();
		mockCreatePublicClient.mockClear();
		mockExecuteMongoOperation.mockClear();

		// Reset mock implementations
		mockReadContract.mockImplementation(async ({ functionName }: any) => {
			if (functionName === "name") return "Test Token";
			if (functionName === "symbol") return "TEST";
			if (functionName === "decimals") return 18;
			if (functionName === "precalculatedWrapperAddress")
				return "0xWRAPPEDV1ADDRESS";
			if (functionName === "computeTokenProxyAddress")
				return "0xWRAPPEDV2ADDRESS";
			return undefined;
		});

		mockExecuteMongoOperation.mockImplementation(
			async (collection: any, fn: any) => {
				return fn(collection);
			}
		);

		// Setup collection IDs
		collectionId = new Map([
			["mainnet", "bridge_hub_api_mappings"],
			["testnet", "bridge_hub_api_mappings_testnet"],
			["devnet", "bridge_hub_api_mappings_devnet"],
		]);

		// Setup chain config
		chainConfig = new Map([
			[
				"mainnet",
				new Map([
					[1, "https://eth-mainnet.example.com"],
					[20, "https://polygon-zkEVM-mainnet.example.com"],
					[137, "https://polygon-mainnet.example.com"],
				]),
			],
			[
				"testnet",
				new Map([
					[1, "https://eth-sepolia.example.com"],
					[20, "https://polygon-zkEVM-sepolia.example.com"],
					[11155111, "https://eth-sepolia-2.example.com"],
				]),
			],
			[
				"devnet",
				new Map([
					[1, "https://eth-devnet.example.com"],
					[20, "https://polygon-zkEVM-devnet.example.com"],
					[2, "https://polygon-devnet.example.com"],
				]),
			],
		]);

		// Setup bridge addresses
		bridgeAddress = new Map([
			["mainnet", "0x2a3DD3EB832aF982ec71669E178424b10Dca2EDe"],
			["testnet", "0x528e26b25a34a4A5d0dbDa1d57D318153d2ED582"],
			["devnet", "0x1348947e282138d8f377b467F7D9c2EB0F335d1f"],
		]);

		// Setup mock collection
		mockCollection = {
			find: mock(function (_filter: any) {
				return {
					sort: mock(function (_sortOptions: any) {
						return {
							limit: mock(function (_limitValue: number) {
								return {
									toArray: mock(async () => [
										{
											originTokenAddress: "0xORIGINTOKEN",
											originTokenNetwork: 1,
											wrappedTokenAddress:
												"0xWRAPPEDTOKEN",
											wrappedTokenNetwork: 137,
											timestamp: 1700000000,
										},
									]),
								};
							}),
						};
					}),
				};
			}),
		};

		// Setup mock database
		mockDb = {
			collection: mock(() => mockCollection),
		};

		tokenMetadataService = new TokenMetadataService(
			mockDb,
			collectionId,
			chainConfig,
			bridgeAddress
		);
	});

	describe("getTokenMetadata", () => {
		test("should fetch token metadata from database when mapping exists", async () => {
			const result = await tokenMetadataService.getTokenMetadata(
				Networks.MAINNET,
				"0xORIGINTOKEN"
			);

			expect(result).toEqual({
				name: "Test Token",
				symbol: "TEST",
				decimals: 18,
				originTokenAddress: "0xORIGINTOKEN",
				originTokenNetwork: 1,
				wrappedTokenAddressV1: "0xWRAPPEDV1ADDRESS",
				wrappedTokenAddressV2: "0xWRAPPEDV2ADDRESS",
			});

			expect(mockDb.collection).toHaveBeenCalledWith(
				"bridge_hub_api_mappings"
			);
		});

		test("should query database with correct filter", async () => {
			await tokenMetadataService.getTokenMetadata(
				Networks.MAINNET,
				"0xTESTTOKEN"
			);

			expect(mockCollection.find).toHaveBeenCalledWith({
				$or: [
					{ originTokenAddress: "0xTESTTOKEN" },
					{ wrappedTokenAddress: "0xTESTTOKEN" },
				],
			});
		});

		test("should throw ApiError when collection is not configured", async () => {
			await expect(
				tokenMetadataService.getTokenMetadata(
					"invalid-network" as Networks,
					"0xTESTTOKEN"
				)
			).rejects.toThrow("No collection configured for network");
		});

		test("should fetch from all RPCs when no mapping exists", async () => {
			mockCollection.find = mock(function (_filter: any) {
				return {
					sort: mock(function (_sortOptions: any) {
						return {
							limit: mock(function (_limitValue: number) {
								return {
									toArray: mock(async () => []),
								};
							}),
						};
					}),
				};
			});

			const result = await tokenMetadataService.getTokenMetadata(
				Networks.MAINNET,
				"0xNEWTOKEN"
			);

			expect(result).toBeDefined();
			expect(result?.name).toBe("Test Token");
			expect(result?.symbol).toBe("TEST");
			expect(result?.decimals).toBe(18);
		});

		test("should return undefined when token address is zero address and no mapping exists", async () => {
			mockCollection.find = mock(function (_filter: any) {
				return {
					sort: mock(function (_sortOptions: any) {
						return {
							limit: mock(function (_limitValue: number) {
								return {
									toArray: mock(async () => []),
								};
							}),
						};
					}),
				};
			});

			const result = await tokenMetadataService.getTokenMetadata(
				Networks.MAINNET,
				"0x0000000000000000000000000000000000000000"
			);

			expect(result).toBeUndefined();
		});

		test("should handle RPC errors gracefully when fetching from all RPCs", async () => {
			mockCollection.find = mock(function (_filter: any) {
				return {
					sort: mock(function (_sortOptions: any) {
						return {
							limit: mock(function (_limitValue: number) {
								return {
									toArray: mock(async () => []),
								};
							}),
						};
					}),
				};
			});

			mockReadContract.mockRejectedValue(new Error("Contract not found"));

			const result = await tokenMetadataService.getTokenMetadata(
				Networks.MAINNET,
				"0xINVALIDTOKEN"
			);

			expect(result).toBeUndefined();
		});

		test("should throw BadRequestError when origin RPC is not configured", async () => {
			mockCollection.find = mock(function (_filter: any) {
				return {
					sort: mock(function (_sortOptions: any) {
						return {
							limit: mock(function (_limitValue: number) {
								return {
									toArray: mock(async () => [
										{
											originTokenAddress: "0xORIGINTOKEN",
											originTokenNetwork: 999,
											wrappedTokenAddress:
												"0xWRAPPEDTOKEN",
											wrappedTokenNetwork: 137,
											timestamp: 1700000000,
										},
									]),
								};
							}),
						};
					}),
				};
			});

			await expect(
				tokenMetadataService.getTokenMetadata(
					Networks.MAINNET,
					"0xTESTTOKEN"
				)
			).rejects.toThrow("Unsupported origin token network");
		});

		test("should work correctly for testnet", async () => {
			mockDb.collection = mock(() => mockCollection);

			const result = await tokenMetadataService.getTokenMetadata(
				Networks.TESTNET,
				"0xORIGINTOKEN"
			);

			expect(result).toBeDefined();
			expect(mockDb.collection).toHaveBeenCalledWith(
				"bridge_hub_api_mappings_testnet"
			);
		});

		test("should work correctly for devnet", async () => {
			mockDb.collection = mock(() => mockCollection);

			const result = await tokenMetadataService.getTokenMetadata(
				Networks.DEVNET,
				"0xORIGINTOKEN"
			);

			expect(result).toBeDefined();
			expect(mockDb.collection).toHaveBeenCalledWith(
				"bridge_hub_api_mappings_devnet"
			);
		});

		test("should calculate both V1 and V2 wrapped addresses", async () => {
			const result = await tokenMetadataService.getTokenMetadata(
				Networks.MAINNET,
				"0xORIGINTOKEN"
			);

			expect(result?.wrappedTokenAddressV1).toBe("0xWRAPPEDV1ADDRESS");
			expect(result?.wrappedTokenAddressV2).toBe("0xWRAPPEDV2ADDRESS");
		});

		test("should fetch ERC20 token data correctly", async () => {
			await tokenMetadataService.getTokenMetadata(
				Networks.MAINNET,
				"0xORIGINTOKEN"
			);

			// Check that readContract was called for name, symbol, decimals
			const calls = mockReadContract.mock.calls;
			const functionNames = calls.map(
				(call: any) => call[0].functionName
			);

			expect(functionNames).toContain("name");
			expect(functionNames).toContain("symbol");
			expect(functionNames).toContain("decimals");
		});

		test("should call precalculatedWrapperAddress with correct parameters", async () => {
			await tokenMetadataService.getTokenMetadata(
				Networks.MAINNET,
				"0xORIGINTOKEN"
			);

			const v1Call = mockReadContract.mock.calls.find(
				(call: any) =>
					call[0].functionName === "precalculatedWrapperAddress"
			);

			expect(v1Call).toBeDefined();
			expect(v1Call[0].args).toEqual([
				1,
				"0xORIGINTOKEN",
				"Test Token",
				"TEST",
				18,
			]);
		});

		test("should call computeTokenProxyAddress with correct parameters", async () => {
			await tokenMetadataService.getTokenMetadata(
				Networks.MAINNET,
				"0xORIGINTOKEN"
			);

			const v2Call = mockReadContract.mock.calls.find(
				(call: any) =>
					call[0].functionName === "computeTokenProxyAddress"
			);

			expect(v2Call).toBeDefined();
			expect(v2Call[0].args).toEqual([1, "0xORIGINTOKEN"]);
		});

		test("should handle wrapped address calculation failures gracefully", async () => {
			mockCollection.find = mock(function (_filter: any) {
				return {
					sort: mock(function (_sortOptions: any) {
						return {
							limit: mock(function (_limitValue: number) {
								return {
									toArray: mock(async () => []),
								};
							}),
						};
					}),
				};
			});

			mockReadContract.mockImplementation(
				async ({ functionName }: any) => {
					if (functionName === "name") return "Test Token";
					if (functionName === "symbol") return "TEST";
					if (functionName === "decimals") return 18;
					if (functionName === "precalculatedWrapperAddress")
						throw new Error("V1 calculation failed");
					if (functionName === "computeTokenProxyAddress")
						throw new Error("V2 calculation failed");
					return undefined;
				}
			);

			const result = await tokenMetadataService.getTokenMetadata(
				Networks.MAINNET,
				"0xNEWTOKEN"
			);

			// Should still return metadata with empty wrapped addresses
			expect(result).toBeDefined();
			expect(result?.name).toBe("Test Token");
			expect(result?.wrappedTokenAddressV1).toBe("");
			expect(result?.wrappedTokenAddressV2).toBe("");
		});

		test("should return undefined when no chain config exists", async () => {
			mockCollection.find = mock(function (_filter: any) {
				return {
					sort: mock(function (_sortOptions: any) {
						return {
							limit: mock(function (_limitValue: number) {
								return {
									toArray: mock(async () => []),
								};
							}),
						};
					}),
				};
			});

			const emptyChainConfig = new Map();
			const service = new TokenMetadataService(
				mockDb,
				collectionId,
				emptyChainConfig,
				bridgeAddress
			);

			const result = await service.getTokenMetadata(
				Networks.MAINNET,
				"0xTESTTOKEN"
			);

			expect(result).toBeUndefined();
		});
	});

	describe("constructor", () => {
		test("should initialize with default parameters", () => {
			const service = new TokenMetadataService(mockDb);
			expect(service).toBeInstanceOf(TokenMetadataService);
		});

		test("should initialize with custom parameters", () => {
			const service = new TokenMetadataService(
				mockDb,
				collectionId,
				chainConfig,
				bridgeAddress
			);
			expect(service).toBeInstanceOf(TokenMetadataService);
		});
	});
});
