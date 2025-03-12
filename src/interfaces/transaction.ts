export interface ITransaction {
    // Source specific
    source_bridge_hash: string;
    source_block_num: number; // BN
    source_block_pos: number;
    source_block_timestamp: number;
    source_tx_hash: string;

    // destination specific
    destination_block_num: number;
    destination_block_timestamp: number; // BN
    destination_tx_hash: string;

    // common
    origin_network: number; // origin token network
    origin_address: string; // origin token address

    metadata: string;
    leaf_type: number;
    source_network: number
    destination_network: number;
    destination_address: string; //receiver address
    amount: number; // BN
    deposit_count: number; // BN
    from_address: string; // user address
    global_index: number; // BN
    status: string;
}