import { Schema, Model } from "mongoose";
import { Database } from "../db.js";

import type { ITransaction } from "../../interfaces/transaction";

export default interface ITransactionModel extends Model<ITransaction> { }

const TransactionSchema = new Schema<
    ITransaction,
    ITransactionModel
>(
    {
        source_bridge_hash: {
            type: String,
        },
        source_block_num: {
            type: Number,
        },
        source_block_pos: {
            type: Number,
        },
        source_block_timestamp: {
            type: Number,
        },
        source_tx_hash: {
            type: String,
            lowercase: true,
        },
        destination_block_num: {
            type: Number,
        },
        destination_block_timestamp: {
            type: Number,
        },
        destination_tx_hash: {
            type: String,
            lowercase: true,
        },
        origin_network: {
            type: Number,
        },
        origin_address: {
            type: String,
            lowercase: true,
        },
        metadata: {
            type: String,
            lowercase: true,
        },
        leaf_type: {
            type: Number,
        },
        source_network: {
            type: Number,
        },
        destination_network: {
            type: Number,
        },
        destination_address: {
            type: String,
            lowercase: true,
        },
        amount: {
            type: Number
        },
        deposit_count: {
            type: Number,
        },
        from_address: {
            type: String,
            lowercase: true,
        },
        global_index: {
            type: Number
        },
        status: {
            type: String,
            lowercase: true,
        }
    },
    {
        versionKey: false
    }
);

TransactionSchema.index(
    { from_address: 1, destination_address: 1, source_network: 1, destination_network: 1 },
    { name: "query_index" }
);

/**
 * This class represents transaction model
 *
 * @class
 */
export class TransactionModel {
    /**
     * Get the deposit model defined on this mongoose database instance
     *
     * @param {Database} database
     *
     */
    public static async new(
        database: Database
    ): Promise<ITransactionModel> {
        const model = database.model<
            ITransaction,
            ITransactionModel
        >("Transaction", TransactionSchema);
        await model.createCollection();

        return model;
    }
}
