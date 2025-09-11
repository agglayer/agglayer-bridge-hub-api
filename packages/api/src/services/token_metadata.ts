import {
    ApiError,
    type IQueryOrderOperationParams,
    type IQueryOrFilterParams,
} from "@polygonlabs/servercore";
import type { DatabaseClient } from "@polygonlabs/servercore-firestore";
import type { ITokenMetadata } from "../interfaces/hub_mapping";
import { createPublicClient, http } from "viem";
import { ERC20_ABI } from "../constants/erc20";

let db: DatabaseClient;
let collectionId: Map<string, string>;
let chainConfig: Map<string, Map<number, string>>;
let bridgeAddress: Map<string, string>;

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

    static async getTokenMetadata(
        network: string,
        tokenAddress: string,
        orQueryParams: IQueryOrFilterParams[]
    ): Promise<ITokenMetadata | undefined> {
        let tokenMetadata: ITokenMetadata | undefined;
        const mapping = await db
            .getDocuments(
                collectionId.get(network) || "",
                undefined,
                1,
                orderParams,
                undefined,
                undefined,
                orQueryParams
            )
            .then((docs) => {
                if (docs.length > 0) {
                    return docs[0];
                }
                return undefined;
            });

        if (
            mapping?.originTokenAddress?.toLowerCase() ===
                tokenAddress.toLowerCase() ||
            mapping?.wrappedTokenAddress?.toLowerCase() ===
                tokenAddress.toLowerCase()
        ) {
            try {
                const originTokenNetwork = mapping.originTokenNetwork;
                const rpcUrl = chainConfig
                    .get(network)
                    ?.get(originTokenNetwork);

                if (!rpcUrl) {
                    throw new ApiError(
                        `RPC URL not found for network ${network} and chain ${originTokenNetwork}`
                    );
                }

                const client = createPublicClient({
                    transport: http(rpcUrl),
                });

                const [name, symbol, decimals] = await Promise.all([
                    client.readContract({
                        address: mapping.originTokenAddress as `0x${string}`,
                        abi: ERC20_ABI,
                        functionName: "name",
                    }),
                    client.readContract({
                        address: mapping.originTokenAddress as `0x${string}`,
                        abi: ERC20_ABI,
                        functionName: "symbol",
                    }),
                    client.readContract({
                        address: mapping.originTokenAddress as `0x${string}`,
                        abi: ERC20_ABI,
                        functionName: "decimals",
                    }),
                ]);

                tokenMetadata = {
                    originTokenNetwork: mapping.originTokenNetwork,
                    originTokenAddress: mapping.originTokenAddress,
                    wrappedTokenAddress: mapping.wrappedTokenAddress,
                    name: name as string,
                    symbol: symbol as string,
                    decimals: Number(decimals),
                };
            } catch (error) {
                throw new ApiError("Failed to fetch token metadata", {
                    name: error instanceof Error ? error.message : "Unknown",
                });
            }
        }

        return tokenMetadata;
    }
}
