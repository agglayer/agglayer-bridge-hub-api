export interface IClaimTx {
    block_num: number;
    block_timestamp: number; // BN
    tx_hash: string;
    global_index: number; // BN
    origin_address: string;
    origin_network: number; // origin token network
    destination_address: string;
    destination_network: number;
    amount: number; // BN
    from_address: string;
}
