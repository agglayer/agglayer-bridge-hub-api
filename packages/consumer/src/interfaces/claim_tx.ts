import type { IBridgeAPIResult } from "./bridge_api_result";

// Re-export shared types from @agglayer/bridge-hub-types
export type {
	TransactionStatus,
	IHubClaimTransaction,
} from "@agglayer/bridge-hub-types";

/**
 * Interface for the Aggkit Claim Tx element
 */
export interface IClaimTx {
	block_num: number;
	block_timestamp: number; // BN
	tx_hash: string;
	global_index: string;
	origin_address: string;
	origin_network: number; // origin token network
	destination_address: string;
	destination_network: number;
	amount: string; // BN
	from_address: string;
}

/**
 * Interface for the Aggkit Bridge API bridge_getClaims method's result
 */
export interface IClaimsBridgeAPIResult extends IBridgeAPIResult {
	claims: IClaimTx[];
}
