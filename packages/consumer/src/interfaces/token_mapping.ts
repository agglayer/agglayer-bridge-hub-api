import type { IBridgeAPIResult } from './bridge_api_result.ts';

// Re-export shared types from @agglayer/bridge-hub-types
export type { IHubTokenMappings } from '@agglayer/bridge-hub-types';

/**
 * Interface for the Aggkit Mapping Tx element
 */
export interface IMappingTx {
	metadata: string;
	calldata: string;
	block_num: number; // BN
	block_pos: number;
	block_timestamp: number; // BN
	tx_hash: string;
	origin_network: number;
	origin_token_address: string;
	wrapped_token_address: string;
}

/**
 * Interface for the Aggkit Bridge API bridge_getMappings method's result
 */
export interface IMappingsBridgeAPIResult extends IBridgeAPIResult {
	tokenMappings: IMappingTx[];
}
