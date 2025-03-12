export interface IMapping {
    tx_hash: string;
    token_type: string;
    origin_network: number;
    origin_address: string;
    wrapped_address: string;
    wrapped_network: number;
    name?: string;
    symbol?: string;
    decimals?: number;
}