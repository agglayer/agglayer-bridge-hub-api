import type { Document } from 'mongodb';

import type { IHubTransaction } from './bridge_transaction.ts';

/**
 * MongoDB document interface for Hub Transactions
 * Extends the base IHubTransaction (which includes both bridge and claim fields)
 * with MongoDB's Document type and _id field
 */
export interface ITransactionDocument extends Document, IHubTransaction {
	_id: string;
}
