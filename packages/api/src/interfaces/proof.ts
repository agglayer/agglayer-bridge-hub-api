export interface IProof {
    proof_local_exit_root: string[];
    proof_rollup_exit_root: string[];
    l1_info_tree_leaf: {
        block_num: number;
        block_pos: number;
        l1_info_tree_index: number;
        previous_block_hash: string;
        timestamp: number;
        mainnet_exit_root: string;
        rollup_exit_root: string;
        global_exit_root: string;
        hash: string;
    };
}
