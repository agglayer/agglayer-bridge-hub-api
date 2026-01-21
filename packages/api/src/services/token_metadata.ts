import { BadRequestError, Logger, ApiError } from "@polygonlabs/servercore";
import type { Db, Collection } from "mongodb";
import {
	executeMongoOperation,
	type Document,
} from "@agglayer/bridge-hub-commons";
import { createPublicClient, http } from "viem";
import { ERC20_ABI } from "../constants/erc20";
import { BRIDGE_ABI_V2, BRIDGE_ABI_V1 } from "../constants/bridge";
import type { TokenMetadata, HubTokenMapping } from "../schemas";

interface MappingDocument extends Document, HubTokenMapping {
	_id: string;
}

export class TokenMetadataService {
	private readonly db: Db;
	private readonly collectionId: Map<string, string>;
	private readonly chainConfig: Map<string, Map<number, string>>;
	private readonly bridgeAddress: Map<string, string>;
	private readonly V1_NETWORK_ID: number = 1;
	private readonly V2_NETWORK_ID: number = 20;

	constructor(
		database: Db,
		collectionIdParam: Map<string, string> = new Map([
			["mainnet", "bridge_hub_api_mappings"],
			["testnet", "bridge_hub_api_mappings_testnet"],
			["devnet", "bridge_hub_api_mappings_testnet"],
		]),
		chainConfigParam: Map<string, Map<number, string>> = new Map([
			["mainnet", new Map([])],
			["testnet", new Map([])],
			["devnet", new Map([])],
		]),
		bridgeAddressParam: Map<string, string> = new Map([
			["mainnet", "0x2a3DD3EB832aF982ec71669E178424b10Dca2EDe"],
			["testnet", "0x1348947e282138d8f377b467F7D9c2EB0F335d1f"],
			["devnet", "0x1348947e282138d8f377b467F7D9c2EB0F335d1f"],
		])
	) {
		this.db = database;
		this.collectionId = collectionIdParam;
		this.chainConfig = chainConfigParam;
		this.bridgeAddress = bridgeAddressParam;
	}

	private async fetchERC20TokenData(
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

	private async calculateWrappedAddressV1(
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

	private async calculateWrappedAddressV2(
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

	async getTokenMetadata(
		network: string,
		tokenAddress: string
	): Promise<TokenMetadata | undefined> {
		const collectionName = this.collectionId.get(network);
		if (!collectionName) {
			throw new ApiError(
				`No collection configured for network: ${network}`,
				{
					context: {
						service: "TokenMetadataService",
						network,
						availableNetworks: Array.from(this.collectionId.keys()),
					},
				}
			);
		}
		const collection: Collection<MappingDocument> =
			this.db.collection(collectionName);

		// Build MongoDB filter with $or query
		const filter: any = {
			$or: [
				{ originTokenAddress: tokenAddress },
				{ wrappedTokenAddress: tokenAddress },
			],
		};

		// Execute query
		const mappingsResult = await executeMongoOperation(
			collection,
			(col) =>
				col.find(filter).sort({ timestamp: -1 }).limit(1).toArray(),
			{
				operationName: "getTokenMetadata",
				logContext: { network, tokenAddress },
			}
		);

		if (!mappingsResult || mappingsResult.length === 0) {
			return await this.fetchTokenMetadataFromAllRPCs(
				network,
				tokenAddress
			);
		}

		const originTokenAddress = mappingsResult[0].originTokenAddress;
		const originTokenNetwork = mappingsResult[0].originTokenNetwork;

		//get token details from chain
		const rpcUrl =
			this.chainConfig.get(network)?.get(originTokenNetwork) || undefined;
		const rpcUrlV1 =
			this.chainConfig.get(network)?.get(this.V1_NETWORK_ID) || undefined;
		const rpcUrlV2 =
			this.chainConfig.get(network)?.get(this.V2_NETWORK_ID) || undefined;

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
			this.bridgeAddress.get(network) || "",
			originTokenNetwork,
			originTokenAddress,
			tokenData.name,
			tokenData.symbol,
			tokenData.decimals
		);

		const wrappedTokenAddressV2 = await this.calculateWrappedAddressV2(
			v2Client,
			this.bridgeAddress.get(network) || "",
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

	private async fetchTokenMetadataFromAllRPCs(
		network: string,
		tokenAddress: string
	): Promise<TokenMetadata | undefined> {
		if (tokenAddress === "0x0000000000000000000000000000000000000000") {
			return undefined;
		}

		const networkChainConfig = this.chainConfig.get(network);
		if (!networkChainConfig || networkChainConfig.size === 0) {
			return undefined;
		}

		const bridgeAddr = this.bridgeAddress.get(network);
		if (!bridgeAddr) {
			Logger.warn(`Bridge address not found for network ${network}`);
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
						this.chainConfig
							.get(network)
							?.get(this.V1_NETWORK_ID) || rpcUrl
					),
				});

				const v2Client = createPublicClient({
					transport: http(
						this.chainConfig
							.get(network)
							?.get(this.V2_NETWORK_ID) || rpcUrl
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
				Logger.warn({
					location: "fetchTokenMetadataFromAllRPCs",
					message: `Failed to fetch token details from network ${networkId}:`,
					error,
				});
				continue;
			}
		}

		return undefined;
	}
}
