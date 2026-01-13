import { z } from "@hono/zod-openapi";

/**
 * Enum for TransactionStatus. It contains the 4 values BRIDGED, READY_TO_CLAIM, CLAIM_IN_PROGRESS and CLAIMED
 */
export enum TransactionStatus {
	BRIDGED = "BRIDGED",
	LEAF_INCLUDED = "LEAF_INCLUDED",
	READY_TO_CLAIM = "READY_TO_CLAIM",
	CLAIMED = "CLAIMED",
}

/**
 * Zod schema for TransactionStatus validation
 */
export const TransactionStatusSchema = z.enum(
	Object.values(TransactionStatus) as [string, ...string[]]
);
