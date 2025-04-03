import { TransactionStatus } from "bridge-hub-commons/enums/transaction_status";
import type {
    IBridgeTx,
    IHubBridgeTransaction,
} from "bridge-hub-commons/interfaces/bridge_tx";
import type {
    IClaimTx,
    IHubClaimTransaction,
} from "bridge-hub-commons/interfaces/claim_tx";
import type { IDecodedGlobalIndex } from "bridge-hub-commons/interfaces/decoded_global_index";

export default class TransactionMapper {
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

    public mapClaimTransactions(events: IClaimTx[]): IHubClaimTransaction[] {
        const formattedClaimTransactions: IHubClaimTransaction[] = [];
        events.forEach((claimTransaction) => {
            const decodedGlobalIndex = this.decodeGlobalIndex(
                claimTransaction.global_index
            );
            formattedClaimTransactions.push({
                claimTransactionHash: claimTransaction.tx_hash.toLowerCase(),
                claimBlockNumber: claimTransaction.block_num,
                claimTimestamp: claimTransaction.block_timestamp,
                globalIndex: claimTransaction.global_index,
                sourceNetwork: decodedGlobalIndex.sourceNetwork,
                depositCount: decodedGlobalIndex.depositCount,
                status: TransactionStatus.CLAIMED,
            });
        });

        return formattedClaimTransactions;
    }

    private decodeGlobalIndex(globalIndex: number): IDecodedGlobalIndex {
        const globalIndexBigInt = BigInt(globalIndex);
        const globalIndexInHex = globalIndex.toString(16);
        return {
            sourceNetwork:
                globalIndexInHex.length > 16
                    ? 0
                    : Number(globalIndexBigInt >> 32n) + 1,
            depositCount: Number(globalIndexBigInt & 0xffffffffn),
        };
    }
}
