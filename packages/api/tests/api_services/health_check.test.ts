import { describe, test, expect, beforeEach, mock } from "bun:test";

// Mock ApiError
const ApiError = class extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ApiError";
	}
};

// Mock viem
const mockGetBalance = mock(async () => BigInt("20000000000000000"));
const mockCreatePublicClient = mock(() => ({
	getBalance: mockGetBalance,
}));

// Mock modules before imports
mock.module("@polygonlabs/servercore", () => ({
	ApiError,
}));

mock.module("viem", () => ({
	createPublicClient: mockCreatePublicClient,
	http: (url: string) => ({ url }),
}));

// Now import after mocking dependencies
import { HealthCheckService } from "../../src/services/health_check";
import { Networks } from "../../src/enums";

describe("HealthCheckService", () => {
	let healthCheckService: HealthCheckService;
	let mockTransactionService: any;
	let chainConfig: Map<string, Map<number, string>>;

	beforeEach(() => {
		// Clear all mocks
		mockGetBalance.mockClear();
		mockCreatePublicClient.mockClear();

		// Setup chain config
		chainConfig = new Map([
			[
				"mainnet",
				new Map([
					[1, "https://eth-mainnet.example.com"],
					[137, "https://polygon-mainnet.example.com"],
				]),
			],
			[
				"testnet",
				new Map([
					[11155111, "https://eth-sepolia.example.com"],
					[80002, "https://polygon-amoy.example.com"],
				]),
			],
			[
				"devnet",
				new Map([
					[1, "https://eth-devnet.example.com"],
					[2, "https://polygon-devnet.example.com"],
				]),
			],
		]);

		// Mock transaction service
		mockTransactionService = {
			getTransactions: mock(async () => ({
				documents: [],
				totalDocumentsCount: 0,
			})),
		};

		// Reset getBalance mock to default behavior
		mockGetBalance.mockImplementation(async () =>
			BigInt("20000000000000000")
		);

		healthCheckService = new HealthCheckService(
			mockTransactionService,
			chainConfig
		);
	});

	describe("checkForAutoClaim", () => {
		test("should return true when no READY_TO_CLAIM transactions exist", async () => {
			mockTransactionService.getTransactions.mockResolvedValue({
				documents: [],
				totalDocumentsCount: 0,
			});

			const result = await healthCheckService.checkForAutoClaim(
				Networks.MAINNET,
				"1",
				[137]
			);

			expect(result).toBe(true);
			expect(mockTransactionService.getTransactions).toHaveBeenCalledWith(
				{
					network: Networks.MAINNET,
					destinationNetworkIds: [1],
					status: "READY_TO_CLAIM",
					sourceNetworkIds: [137],
					limit: 20,
				}
			);
		});

		test("should return true when READY_TO_CLAIM transactions are recent", async () => {
			const recentTimestamp = Math.floor(Date.now() / 1000) - 1800; // 30 minutes ago

			mockTransactionService.getTransactions.mockResolvedValue({
				documents: [
					{
						leafType: "ASSET",
						timestamp: recentTimestamp,
					},
				],
				totalDocumentsCount: 1,
			});

			const result = await healthCheckService.checkForAutoClaim(
				Networks.MAINNET,
				"1",
				[137]
			);

			expect(result).toBe(true);
		});

		test("should throw error when READY_TO_CLAIM transaction is older than 1 hour", async () => {
			const oldTimestamp = Math.floor(Date.now() / 1000) - 7200; // 2 hours ago

			mockTransactionService.getTransactions.mockResolvedValue({
				documents: [
					{
						leafType: "ASSET",
						timestamp: oldTimestamp,
					},
				],
				totalDocumentsCount: 1,
			});

			await expect(
				healthCheckService.checkForAutoClaim(Networks.MAINNET, "1", [
					137,
				])
			).rejects.toThrow(
				"Auto-claim service might be unhealthy for Network 1: Last READY_TO_CLAIM transaction is older than 1 hour"
			);
		});

		test("should filter and check only ASSET leaf type transactions", async () => {
			const oldTimestamp = Math.floor(Date.now() / 1000) - 7200; // 2 hours ago

			mockTransactionService.getTransactions.mockResolvedValue({
				documents: [
					{
						leafType: "MESSAGE",
						timestamp: oldTimestamp,
					},
					{
						leafType: "ASSET",
						timestamp: oldTimestamp,
					},
				],
				totalDocumentsCount: 2,
			});

			await expect(
				healthCheckService.checkForAutoClaim(Networks.MAINNET, "1", [
					137,
				])
			).rejects.toThrow(
				"Auto-claim service might be unhealthy for Network 1: Last READY_TO_CLAIM transaction is older than 1 hour"
			);
		});

		test("should throw error when RPC is not configured", async () => {
			mockTransactionService.getTransactions.mockResolvedValue({
				documents: [],
				totalDocumentsCount: 0,
			});

			await expect(
				healthCheckService.checkForAutoClaim(Networks.MAINNET, "999", [
					137,
				])
			).rejects.toThrow("RPC not configured for network mainnet 999");
		});

		test("should throw error when balance is insufficient", async () => {
			mockGetBalance.mockResolvedValue(BigInt("5000000000000000")); // 0.005 ETH

			mockTransactionService.getTransactions.mockResolvedValue({
				documents: [],
				totalDocumentsCount: 0,
			});

			await expect(
				healthCheckService.checkForAutoClaim(Networks.MAINNET, "1", [
					137,
				])
			).rejects.toThrow(
				"Auto-claim service might be unhealthy for Network 1: Insufficient balance"
			);
		});

		test("should check balance of correct auto-claim address", async () => {
			mockTransactionService.getTransactions.mockResolvedValue({
				documents: [],
				totalDocumentsCount: 0,
			});

			await healthCheckService.checkForAutoClaim(
				Networks.TESTNET,
				"11155111",
				[80002]
			);

			expect(mockGetBalance).toHaveBeenCalledWith({
				address: "0x616b3Af96437f69B31D03EBbD64Bbc967CE80361",
			});
		});

		test("should work correctly for testnet", async () => {
			mockTransactionService.getTransactions.mockResolvedValue({
				documents: [],
				totalDocumentsCount: 0,
			});

			const result = await healthCheckService.checkForAutoClaim(
				Networks.TESTNET,
				"11155111",
				[80002]
			);

			expect(result).toBe(true);
			expect(mockTransactionService.getTransactions).toHaveBeenCalledWith(
				{
					network: Networks.TESTNET,
					destinationNetworkIds: [11155111],
					status: "READY_TO_CLAIM",
					sourceNetworkIds: [80002],
					limit: 20,
				}
			);
		});

		test("should work correctly for devnet", async () => {
			mockTransactionService.getTransactions.mockResolvedValue({
				documents: [],
				totalDocumentsCount: 0,
			});

			const result = await healthCheckService.checkForAutoClaim(
				Networks.DEVNET,
				"1",
				[2]
			);

			expect(result).toBe(true);
			expect(mockTransactionService.getTransactions).toHaveBeenCalledWith(
				{
					network: Networks.DEVNET,
					destinationNetworkIds: [1],
					status: "READY_TO_CLAIM",
					sourceNetworkIds: [2],
					limit: 20,
				}
			);
		});

		test("should handle multiple source networks", async () => {
			mockTransactionService.getTransactions.mockResolvedValue({
				documents: [],
				totalDocumentsCount: 0,
			});

			const result = await healthCheckService.checkForAutoClaim(
				Networks.MAINNET,
				"1",
				[137, 42161, 10]
			);

			expect(result).toBe(true);
			expect(mockTransactionService.getTransactions).toHaveBeenCalledWith(
				{
					network: Networks.MAINNET,
					destinationNetworkIds: [1],
					status: "READY_TO_CLAIM",
					sourceNetworkIds: [137, 42161, 10],
					limit: 20,
				}
			);
		});

		test("should use correct RPC URL for network", async () => {
			mockTransactionService.getTransactions.mockResolvedValue({
				documents: [],
				totalDocumentsCount: 0,
			});

			await healthCheckService.checkForAutoClaim(
				Networks.MAINNET,
				"137",
				[1]
			);

			expect(mockCreatePublicClient).toHaveBeenCalledWith({
				transport: { url: "https://polygon-mainnet.example.com" },
			});
		});
	});

	describe("constructor", () => {
		test("should initialize with default chain config", () => {
			const service = new HealthCheckService(mockTransactionService);
			expect(service).toBeInstanceOf(HealthCheckService);
		});

		test("should initialize with custom chain config", () => {
			const customConfig = new Map([
				["mainnet", new Map([[1, "https://custom-rpc.example.com"]])],
			]);
			const service = new HealthCheckService(
				mockTransactionService,
				customConfig
			);
			expect(service).toBeInstanceOf(HealthCheckService);
		});
	});
});
