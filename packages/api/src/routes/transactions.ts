import type { OperationsManifest, TypedRegistry } from '@polygonlabs/openapi-registry';

import {
	TransactionByDepositCountResponseSchema,
	TransactionResponseSchema
} from '@agglayer/bridge-hub-types';

import {
	ApiErrorResponseSchema,
	NetworkSchema,
	TransactionsByDepositCountQuerySchema,
	TransactionsQuerySchema
} from '../schemas/index.ts';

export const addTransactionsRoutes = <Prev extends OperationsManifest>(r: TypedRegistry<Prev>) =>
	r
		.registerPath({
			operationId: 'getTransactions',
			method: 'get',
			path: '/{network}/transactions',
			tags: ['transactions'],
			summary: 'Get bridge transactions',
			description: 'Retrieve a paginated list of bridge transactions with optional filtering',
			request: {
				params: NetworkSchema,
				query: TransactionsQuerySchema
			},
			responses: {
				200: {
					content: {
						'application/json': {
							schema: TransactionResponseSchema
						}
					},
					description: 'Successful response with bridge transactions'
				},
				400: {
					content: {
						'application/json': {
							schema: ApiErrorResponseSchema
						}
					},
					description: 'Bad request - invalid parameters'
				}
			}
		})
		.registerPath({
			operationId: 'getTransactionByDepositCount',
			method: 'get',
			path: '/{network}/transactions/{sourceNetworkId}/{depositCount}',
			tags: ['transactions'],
			summary: 'Get transaction by deposit count',
			description: 'Retrieve a specific bridge transaction by source network ID and deposit count',
			request: {
				params: TransactionsByDepositCountQuerySchema
			},
			responses: {
				200: {
					content: {
						'application/json': {
							schema: TransactionByDepositCountResponseSchema
						}
					},
					description: 'Successful response with transaction details'
				},
				400: {
					content: {
						'application/json': {
							schema: ApiErrorResponseSchema
						}
					},
					description: 'Bad request - invalid parameters'
				},
				404: {
					content: {
						'application/json': {
							schema: ApiErrorResponseSchema
						}
					},
					description: 'Transaction not found'
				}
			}
		});
