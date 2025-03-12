import { Schema, Model } from "mongoose";
import { Database } from "../db.js";

import type { IMapping } from "../../interfaces/mapping";

export default interface IMappingModel extends Model<IMapping> { }

const MappingSchema = new Schema<
    IMapping,
    IMappingModel
>(
    {
        tx_hash: {
            type: String,
        },
        token_type: {
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
        wrapped_address: {
            type: String,
            lowercase: true,
        },
        wrapped_network: {
            type: Number
        },
        name: {
            type: String,
        },
        symbol: {
            type: String,
        },
        decimals: {
            type: Number
        }
    },
    {
        versionKey: false
    }
);

MappingSchema.index(
    { origin_network: 1, origin_address: 1, wrapped_address: 1 },
    { name: "query_index" }
);

/**
 * This class represents Mapping model
 *
 * @class
 */
export class MappingModel {
    /**
     * Get the deposit model defined on this mongoose database instance
     *
     * @param {Database} database
     *
     */
    public static async new(
        database: Database
    ): Promise<IMappingModel> {
        const model = database.model<
            IMapping,
            IMappingModel
        >("Mapping", MappingSchema);
        await model.createCollection();

        return model;
    }
}
