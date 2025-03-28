import { TransactionStatus } from "bridge-hub-commons/enums/transaction_status";
import type {
    IBridgeTx,
    IHubBridgeTransaction,
} from "bridge-hub-commons/interfaces/bridge_tx";

export default class transactionMapper {
    constructor(private networkId: number) {}

    public mapBridgeTransactions(events: IBridgeTx[]): IHubBridgeTransaction[] {
        const formattedBridgeTransactions: IHubBridgeTransaction[] = [];
        events.forEach((bridgeTransaction) => {
            formattedBridgeTransactions.push({
                metadata: bridgeTransaction.metadata,
                blockNumber: bridgeTransaction.block_num,
                transactionIndex: bridgeTransaction.block_pos,
                timestamp: bridgeTransaction.block_timestamp,
                transactionHash: bridgeTransaction.tx_hash.toLowerCase(),
                leafType: bridgeTransaction.leaf_type,
                originTokenNetwork: bridgeTransaction.origin_network,
                originTokenAddress:
                    bridgeTransaction.origin_address.toLowerCase(),
                sourceNetwork: this.networkId,
                destinationNetwork: bridgeTransaction.destination_network,
                receiverAddress:
                    bridgeTransaction.destination_address.toLowerCase(),
                fromAddress: bridgeTransaction.from_address.toLowerCase(),
                amount: bridgeTransaction.amount,
                depositCount: bridgeTransaction.deposit_count,
                bridgeHash: bridgeTransaction.bridge_hash,
                status: TransactionStatus.BRIDGED,
            });
        });

        return formattedBridgeTransactions;
    }
}
