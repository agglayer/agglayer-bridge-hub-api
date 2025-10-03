import {
	BadRequestError,
	type IQueryOrderOperationParams,
	type IQueryOrFilterParams,
} from "@polygonlabs/servercore";
import type { DatabaseClient } from "@polygonlabs/servercore-firestore";
import type { ITokenMetadata } from "../interfaces/hub_mapping";
import { createPublicClient, http } from "viem";
import { ERC20_ABI } from "../constants/erc20";
import { BRIDGE_ABI_V2, BRIDGE_ABI_V1 } from "../constants/bridge";

let db: DatabaseClient;
let collectionId: Map<string, string>;
let chainConfig: Map<string, Map<number, string>>;
let bridgeAddress: Map<string, string>;
const v1NetworkId: number = 1;
const v2NetworkId: number = 20;

// Order params for db request
const orderParams: IQueryOrderOperationParams[] = [
	{
		field: "timestamp",
		order: "desc",
	},
];

export class TokenMetadataService {
	static initializeTokenMetadataService(
		database: DatabaseClient,
		collectionIdParam: Map<string, string> = new Map([
			["mainnet", "mappings"],
			["testnet", "mappings_testnet"],
		]),
		chainConfigParam: Map<string, Map<number, string>> = new Map([
			["mainnet", new Map([])],
			["testnet", new Map([])],
		]),
		bridgeAddressParam: Map<string, string> = new Map([
			["mainnet", "0x2a3DD3EB832aF982ec71669E178424b10Dca2EDe"],
			["testnet", "0x1348947e282138d8f377b467F7D9c2EB0F335d1f"],
		])
	) {
		if (!db) {
			db = database;
			collectionId = collectionIdParam;
			chainConfig = chainConfigParam;
			bridgeAddress = bridgeAddressParam;
		}
	}

	private static async fetchERC20TokenData(
		client: any,
		tokenAddress: string
	): Promise<{ name: string; symbol: string; decimals: number }> {
		const [name, symbol, decimals] = await Promise.all([
			client.readContract({
				address: tokenAddress as `0x${string}`,
				abi: ERC20_ABI,
				functionName: "name",
			}),
			client.readContract({
				address: tokenAddress as `0x${string}`,
				abi: ERC20_ABI,
				functionName: "symbol",
			}),
			client.readContract({
				address: tokenAddress as `0x${string}`,
				abi: ERC20_ABI,
				functionName: "decimals",
			}),
		]);

		return {
			name: name as string,
			symbol: symbol as string,
			decimals: Number(decimals),
		};
	}

	private static async calculateWrappedAddressV1(
		client: any,
		bridgeAddr: string,
		originTokenNetwork: number,
		originTokenAddress: string,
		name: string,
		symbol: string,
		decimals: number
	): Promise<string> {
		return (await client.readContract({
			address: bridgeAddr as `0x${string}`,
			abi: BRIDGE_ABI_V1,
			functionName: "precalculatedWrapperAddress",
			args: [
				originTokenNetwork,
				originTokenAddress as `0x${string}`,
				name,
				symbol,
				decimals,
			],
		})) as string;
	}

	private static async calculateWrappedAddressV2(
		client: any,
		bridgeAddr: string,
		originTokenNetwork: number,
		originTokenAddress: string
	): Promise<string> {
		return (await client.readContract({
			address: bridgeAddr as `0x${string}`,
			abi: BRIDGE_ABI_V2,
			functionName: "computeTokenProxyAddress",
			args: [originTokenNetwork, originTokenAddress as `0x${string}`],
		})) as string;
	}

	static async getTokenMetadata(
		network: string,
		tokenAddress: string
	): Promise<ITokenMetadata | undefined> {
		if (!db || !collectionId) {
			throw new Error(
				"TokenMetadataService not initialized. Call initializeTokenMetadataService first."
			);
		}

		// Create query params for db request
		const queryParams: IQueryOrFilterParams[] = [];

		if (tokenAddress) {
			queryParams.push({
				or: [
					{
						field: "originTokenAddress",
						operator: "==",
						value: tokenAddress,
					},
					{
						field: "wrappedTokenAddress",
						operator: "==",
						value: tokenAddress,
					},
				],
			});
		}

		const mappings = await db
			.getDocuments({
				collectionPath: collectionId.get(network) || "",
				limit: 1,
				order: orderParams,
				orFilters: queryParams,
			})
			.then((res) => {
				if (res.documents.length > 0) {
					return res.documents;
				}
				return undefined;
			});

		if (!mappings) {
			console.log(
				"No mappings found for the token, querying all RPC configs"
			);
			return await this.fetchTokenMetadataFromAllRPCs(
				network,
				tokenAddress
			);
		}

		const originTokenAddress = mappings[0].originTokenAddress;
		const originTokenNetwork = mappings[0].originTokenNetwork;

		//get token details from chain
		const rpcUrl =
			chainConfig.get(network)?.get(originTokenNetwork) || undefined;
		const rpcUrlV1 =
			chainConfig.get(network)?.get(v1NetworkId) || undefined;
		const rpcUrlV2 =
			chainConfig.get(network)?.get(v2NetworkId) || undefined;

		if (!rpcUrl || !rpcUrlV1 || !rpcUrlV2) {
			throw new BadRequestError(
				`Unsupported origin token network ${originTokenNetwork} for ${network}`
			);
		}

		const originClient = createPublicClient({
			transport: http(rpcUrl),
		});

		const v1Client = createPublicClient({
			transport: http(rpcUrlV1),
		});

		const v2Client = createPublicClient({
			transport: http(rpcUrlV2),
		});

		const tokenData = await this.fetchERC20TokenData(
			originClient,
			originTokenAddress
		);

		const wrappedTokenAddressV1 = await this.calculateWrappedAddressV1(
			v1Client,
			bridgeAddress.get(network) || "",
			originTokenNetwork,
			originTokenAddress,
			tokenData.name,
			tokenData.symbol,
			tokenData.decimals
		);

		const wrappedTokenAddressV2 = await this.calculateWrappedAddressV2(
			v2Client,
			bridgeAddress.get(network) || "",
			originTokenNetwork,
			originTokenAddress
		);

		return {
			name: tokenData.name,
			symbol: tokenData.symbol,
			decimals: tokenData.decimals,
			originTokenAddress,
			originTokenNetwork,
			wrappedTokenAddressV1,
			wrappedTokenAddressV2,
		};
	}

	private static async fetchTokenMetadataFromAllRPCs(
		network: string,
		tokenAddress: string
	): Promise<ITokenMetadata | undefined> {
		if (!chainConfig || !bridgeAddress) {
			throw new Error(
				"TokenMetadataService not initialized. Call initializeTokenMetadataService first."
			);
		}

		const networkChainConfig = chainConfig.get(network);
		if (!networkChainConfig || networkChainConfig.size === 0) {
			return undefined;
		}

		const bridgeAddr = bridgeAddress.get(network);
		if (!bridgeAddr) {
			console.log(`Bridge address not found for network ${network}`);
			return undefined;
		}

		// Try all networks to find the token
		for (const [networkId, rpcUrl] of networkChainConfig.entries()) {
			try {
				const client = createPublicClient({
					transport: http(rpcUrl),
				});

				const tokenData = await this.fetchERC20TokenData(
					client,
					tokenAddress
				);

				// Calculate both v1 and v2 wrapped addresses
				const v1Client = createPublicClient({
					transport: http(
						chainConfig.get(network)?.get(v1NetworkId) || rpcUrl
					),
				});

				const v2Client = createPublicClient({
					transport: http(
						chainConfig.get(network)?.get(v2NetworkId) || rpcUrl
					),
				});

				const [wrappedTokenAddressV1, wrappedTokenAddressV2] =
					await Promise.allSettled([
						this.calculateWrappedAddressV1(
							v1Client,
							bridgeAddr,
							networkId,
							tokenAddress,
							tokenData.name,
							tokenData.symbol,
							tokenData.decimals
						),
						this.calculateWrappedAddressV2(
							v2Client,
							bridgeAddr,
							networkId,
							tokenAddress
						),
					]);

				return {
					name: tokenData.name,
					symbol: tokenData.symbol,
					decimals: tokenData.decimals,
					originTokenAddress: tokenAddress,
					originTokenNetwork: networkId,
					wrappedTokenAddressV1:
						wrappedTokenAddressV1.status === "fulfilled"
							? wrappedTokenAddressV1.value
							: "",
					wrappedTokenAddressV2:
						wrappedTokenAddressV2.status === "fulfilled"
							? wrappedTokenAddressV2.value
							: "",
				};
			} catch (error) {
				console.log(
					`Failed to fetch token details from network ${networkId}:`,
					error
				);
				continue;
			}
		}

		return undefined;
	}
}
