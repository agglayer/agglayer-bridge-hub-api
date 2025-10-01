import { ApiError } from "@polygonlabs/servercore";
import { TransactionService } from "./transactions";
import { createPublicClient, http } from "viem";

let chainConfig: Map<string, Map<number, string>>;
let autoclaimAddress: Map<string, string>;

export class HealthCheckService {
	static initializeHealthCheckService(
		chainConfigParam: Map<string, Map<number, string>> = new Map([
			["mainnet", new Map([])],
			["testnet", new Map([])],
		]),
		autoclaimAddressParam: Map<string, string> = new Map([
			["mainnet", "0x616b3Af96437f69B31D03EBbD64Bbc967CE80361"],
			["testnet", "0xC2517e892B487A3d6F37d81F70cBC9C7ab4C509B"],
		])
	) {
		chainConfig = chainConfigParam;
		autoclaimAddress = autoclaimAddressParam;
	}

	static async checkForAutoClaim(
		network: string,
		networkId: string
	): Promise<boolean> {
		const transactions = await TransactionService.getTransactions(network, [
			{
				field: "destinationNetwork",
				operator: "==",
				value: parseInt(networkId, 10),
			},
			{
				field: "status",
				operator: "==",
				value: "READY_TO_CLAIM",
			},
		]);

		if (transactions && transactions.documents?.length) {
			if (
				transactions.documents[transactions.documents.length - 1]
					.timestamp *
					1000 <
				Date.now() - 60 * 60 * 1000
			) {
				throw new ApiError(
					`Auto-claim service might be unhealthy for Network ${networkId}: Last READY_TO_CLAIM transaction is older than 1 hour`
				);
			}
		}

		const rpc = chainConfig.get(network)?.get(parseInt(networkId, 10));
		const autoClaimAddress = autoclaimAddress.get(network);
		if (!rpc || !autoClaimAddress) {
			throw new ApiError(
				`RPC not configured for network ${network} ${networkId}`
			);
		}

		const client = createPublicClient({
			transport: http(rpc),
		});
		const balance = await client.getBalance({
			address: autoClaimAddress as `0x${string}`,
		});
		if (balance < BigInt("10000000000000000")) {
			throw new ApiError(
				`Auto-claim service might be unhealthy for Network ${networkId}: Insufficient balance`
			);
		}

		return true;
	}
}
