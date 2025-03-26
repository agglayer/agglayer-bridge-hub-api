export interface IMappingTx {
    metadata: string;
    block_num: number; // BN
    block_pos: number;
    block_timestamp: number; // BN
    tx_hash: string;
    origin_network: number;
    origin_token_address: string;
    wrapped_token_address: string;
}
