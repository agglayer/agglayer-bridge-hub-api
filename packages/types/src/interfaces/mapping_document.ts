import type { Document } from "mongodb";
import type { IHubTokenMappings } from "./token_mapping";

/**
 * MongoDB document interface for Hub Token Mappings
 * Extends the base IHubTokenMappings with MongoDB's Document type and _id field
 */
export interface IMappingDocument extends Document, IHubTokenMappings {
	_id: string;
}
