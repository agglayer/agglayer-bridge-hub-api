import { ApiError } from "@polygonlabs/servercore";
import { TransactionService } from "./transactions";
import { createPublicClient, http } from "viem";
import { Networks } from "../enums";

export class HealthCheckService {
	private readonly chainConfig: Map<string, Map<number, string>>;
	private readonly transactionService: TransactionService;
	private readonly autoclaimAddress =
		"0x616b3Af96437f69B31D03EBbD64Bbc967CE80361";

	constructor(
		transactionService: TransactionService,
		chainConfigParam: Map<string, Map<number, string>> = new Map([
			["mainnet", new Map([])],
			["testnet", new Map([])],
			["devnet", new Map([])],
		])
	) {
		this.transactionService = transactionService;
		this.chainConfig = chainConfigParam;
	}

	async checkForAutoClaim(
		network: Networks,
		networkId: string,
		sourceNetworkIds: Array<number>
	): Promise<boolean> {
		const transactions = await this.transactionService.getTransactions({
			network,
			destinationNetworkIds: [parseInt(networkId, 10)],
			status: "READY_TO_CLAIM",
			sourceNetworkIds,
			limit: 20,
		});

		if (transactions?.documents?.length) {
			const filteredTxns = transactions.documents.filter(
				(obj) => obj.leafType === "ASSET"
			);
			if (
				filteredTxns &&
				filteredTxns.length &&
				filteredTxns[filteredTxns.length - 1].timestamp * 1000 <
					Date.now() - 60 * 60 * 1000
			) {
				throw new ApiError(
					`Auto-claim service might be unhealthy for Network ${networkId}: Last READY_TO_CLAIM transaction is older than 1 hour`
				);
			}
		}

		const rpc = this.chainConfig.get(network)?.get(parseInt(networkId, 10));
		if (!rpc) {
			throw new ApiError(
				`RPC not configured for network ${network} ${networkId}`
			);
		}

		const client = createPublicClient({
			transport: http(rpc),
		});
		const balance = await client.getBalance({
			address: this.autoclaimAddress as `0x${string}`,
		});
		if (balance < BigInt("10000000000000000")) {
			throw new ApiError(
				`Auto-claim service might be unhealthy for Network ${networkId}: Insufficient balance`
			);
		}

		return true;
	}
}
