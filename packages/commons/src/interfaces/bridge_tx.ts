export interface IBridgeTx {
    metadata: string;
    bridge_hash: string;
    block_num: number; // BN
    block_pos: number;
    block_timestamp: number;
    leaf_type: number;
    origin_network: number; // origin token network
    origin_address: string; // origin token address
    destination_network: number;
    destination_address: string;
    amount: number; // BN
    deposit_count: number; // BN
    tx_hash: string;
    from_address: string; // user address
}
