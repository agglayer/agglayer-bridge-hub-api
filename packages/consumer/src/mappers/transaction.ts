import { generateDeterministicULID } from "@polygonlabs/servercore";
import { LeafType } from "../enums/leaf_type";
import { TransactionStatus } from "../enums/transaction_status";
import type { IBridgeTx, IHubBridgeTransaction } from "../interfaces/bridge_tx";
import type { IClaimTx, IHubClaimTransaction } from "../interfaces/claim_tx";
import type { IDecodedGlobalIndex } from "../interfaces/decoded_global_index";

export default class TransactionMapper {
    constructor(private readonly networkId: number) {}

    public mapBridgeTransactions(events: IBridgeTx[]): IHubBridgeTransaction[] {
        const formattedBridgeTransactions: IHubBridgeTransaction[] = [];
        events.forEach((bridgeTransaction) => {
            formattedBridgeTransactions.push({
                hubUID: generateDeterministicULID(
                    [
                        this.networkId.toString(),
                        bridgeTransaction.deposit_count.toString(),
                    ],
                    bridgeTransaction.block_timestamp
                ),
                blockNumber: bridgeTransaction.block_num,
                transactionIndex: bridgeTransaction.block_pos,
                timestamp: bridgeTransaction.block_timestamp,
                transactionHash: bridgeTransaction.tx_hash.toLowerCase(),
                leafType:
                    LeafType.ASSET === bridgeTransaction.leaf_type
                        ? "ASSET"
                        : "MESSAGE",
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
                lastUpdatedAt: Date.now(),
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
                lastUpdatedAt: Date.now(),
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
