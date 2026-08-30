import { describe, test, expect } from 'vitest';

import { PaginationSchema } from '../../src/schemas/common.ts';
import {
	ClaimProofQuerySchema,
	MappingsByTokenQuerySchema,
	MappingsQuerySchema,
	NetworkSchema,
	TokenMetadataQuerySchema,
	TransactionsByDepositCountQuerySchema,
	TransactionsQuerySchema
} from '../../src/schemas/index.ts';

// These schemas are the request-validation surface the @polygonlabs/express
// registry router runs directly against `req.params`/`req.query` (see
// createRequestValidator in @polygonlabs/express/registry). There is no
// bespoke middleware left to test — the router's own validator is already
// covered upstream — so this suite exercises the Zod schemas themselves,
// carrying over the same edge-case matrix the old validate_query_params
// middleware tests covered.
describe('transactions query params', () => {
	describe('NetworkSchema (path params)', () => {
		test('accepts a valid network', () => {
			const result = NetworkSchema.safeParse({ network: 'testnet' });
			expect(result.success).toBe(true);
		});

		test('rejects an empty network', () => {
			const result = NetworkSchema.safeParse({ network: '' });
			expect(result.success).toBe(false);
		});

		test('rejects a missing network', () => {
			const result = NetworkSchema.safeParse({});
			expect(result.success).toBe(false);
		});

		test('rejects a non-string network', () => {
			const result = NetworkSchema.safeParse({ network: 123 });
			expect(result.success).toBe(false);
		});

		test('rejects a null network', () => {
			const result = NetworkSchema.safeParse({ network: null });
			expect(result.success).toBe(false);
		});
	});

	describe('TransactionsQuerySchema', () => {
		test('accepts valid query params', () => {
			const result = TransactionsQuerySchema.safeParse({
				fromAddress: '0x1234567890abcdef1234567890abcdef12345678',
				limit: '10'
			});
			expect(result.success).toBe(true);
		});

		test('accepts an empty query (all fields optional except defaulted limit)', () => {
			const result = TransactionsQuerySchema.safeParse({});
			expect(result.success).toBe(true);
		});

		test('rejects an invalid Ethereum address', () => {
			const result = TransactionsQuerySchema.safeParse({
				fromAddress: 'invalid-address',
				limit: '10'
			});
			expect(result.success).toBe(false);
		});

		test('rejects a non-numeric limit', () => {
			const result = TransactionsQuerySchema.safeParse({ limit: 'not-a-number' });
			expect(result.success).toBe(false);
		});
	});

	describe('TransactionsByDepositCountQuerySchema (path params)', () => {
		test('accepts valid parameters', () => {
			const result = TransactionsByDepositCountQuerySchema.safeParse({
				network: 'testnet',
				depositCount: '42',
				sourceNetworkId: '1'
			});
			expect(result.success).toBe(true);
		});

		test('rejects a non-numeric depositCount', () => {
			const result = TransactionsByDepositCountQuerySchema.safeParse({
				network: 'testnet',
				depositCount: 'not-a-number',
				sourceNetworkId: '1'
			});
			expect(result.success).toBe(false);
		});

		test('rejects missing required parameters', () => {
			const result = TransactionsByDepositCountQuerySchema.safeParse({ network: 'testnet' });
			expect(result.success).toBe(false);
		});

		test('rejects a negative depositCount', () => {
			const result = TransactionsByDepositCountQuerySchema.safeParse({
				network: 'testnet',
				depositCount: '-1',
				sourceNetworkId: '1'
			});
			expect(result.success).toBe(false);
		});
	});
});

describe('mappings query params', () => {
	describe('MappingsQuerySchema', () => {
		test('accepts valid query params', () => {
			const result = MappingsQuerySchema.safeParse({
				originTokenAddress: '0x1234567890abcdef1234567890abcdef12345678',
				originNetworkIds: '1,137',
				limit: '20'
			});
			expect(result.success).toBe(true);
		});

		test('accepts a minimal (empty) query', () => {
			const result = MappingsQuerySchema.safeParse({});
			expect(result.success).toBe(true);
		});

		test('rejects an invalid token address', () => {
			const result = MappingsQuerySchema.safeParse({
				originTokenAddress: 'invalid-address'
			});
			expect(result.success).toBe(false);
		});

		test('rejects malformed network IDs', () => {
			const result = MappingsQuerySchema.safeParse({ originNetworkIds: 'invalid,ids' });
			expect(result.success).toBe(false);
		});
	});

	describe('MappingsByTokenQuerySchema (path params)', () => {
		test('accepts valid token parameters', () => {
			const result = MappingsByTokenQuerySchema.safeParse({
				network: 'testnet',
				tokenAddress: '0x1234567890abcdef1234567890abcdef12345678',
				tokenNetwork: '1'
			});
			expect(result.success).toBe(true);
		});

		test('rejects an invalid token address', () => {
			const result = MappingsByTokenQuerySchema.safeParse({
				network: 'testnet',
				tokenAddress: 'invalid-token-address',
				tokenNetwork: '1'
			});
			expect(result.success).toBe(false);
		});

		test('rejects an invalid token network', () => {
			const result = MappingsByTokenQuerySchema.safeParse({
				network: 'testnet',
				tokenAddress: '0x1234567890abcdef1234567890abcdef12345678',
				tokenNetwork: 'invalid-network'
			});
			expect(result.success).toBe(false);
		});

		test('rejects missing required parameters', () => {
			const result = MappingsByTokenQuerySchema.safeParse({ network: 'testnet' });
			expect(result.success).toBe(false);
		});
	});

	describe('PaginationSchema', () => {
		test('accepts valid pagination params', () => {
			const result = PaginationSchema.safeParse({ limit: '10', startAfter: 'cursor123' });
			expect(result.success).toBe(true);
		});

		test('rejects a non-numeric limit', () => {
			const result = PaginationSchema.safeParse({ limit: 'invalid-limit' });
			expect(result.success).toBe(false);
		});
	});
});

describe('token metadata query params', () => {
	describe('TokenMetadataQuerySchema (path params)', () => {
		test('accepts valid token metadata parameters', () => {
			const result = TokenMetadataQuerySchema.safeParse({
				network: 'testnet',
				tokenAddress: '0x1234567890abcdef1234567890abcdef12345678'
			});
			expect(result.success).toBe(true);
		});

		test('rejects an invalid token address', () => {
			const result = TokenMetadataQuerySchema.safeParse({
				network: 'testnet',
				tokenAddress: '0xinvalid'
			});
			expect(result.success).toBe(false);
		});

		test('rejects a missing network parameter', () => {
			const result = TokenMetadataQuerySchema.safeParse({
				tokenAddress: '0x1234567890abcdef1234567890abcdef12345678'
			});
			expect(result.success).toBe(false);
		});

		test('rejects completely empty parameters', () => {
			const result = TokenMetadataQuerySchema.safeParse({});
			expect(result.success).toBe(false);
		});
	});
});

describe('claim proof query params', () => {
	describe('NetworkSchema + ClaimProofQuerySchema', () => {
		test('accepts valid proof parameters', () => {
			const params = NetworkSchema.safeParse({ network: 'testnet' });
			const query = ClaimProofQuerySchema.safeParse({
				depositCount: '42',
				sourceNetworkId: '1',
				leafIndex: '100'
			});
			expect(params.success).toBe(true);
			expect(query.success).toBe(true);
		});

		test('rejects non-numeric query values', () => {
			const result = ClaimProofQuerySchema.safeParse({
				depositCount: 'invalid',
				sourceNetworkId: 'not-a-number',
				leafIndex: '-1'
			});
			expect(result.success).toBe(false);
		});

		test('rejects a null network', () => {
			const result = NetworkSchema.safeParse({ network: null });
			expect(result.success).toBe(false);
		});

		test('rejects missing required query parameters', () => {
			const result = ClaimProofQuerySchema.safeParse({});
			expect(result.success).toBe(false);
		});

		test('rejects partial missing query parameters', () => {
			const result = ClaimProofQuerySchema.safeParse({ depositCount: '42' });
			expect(result.success).toBe(false);
		});

		test('rejects a negative leafIndex', () => {
			const result = ClaimProofQuerySchema.safeParse({
				depositCount: '42',
				sourceNetworkId: '1',
				leafIndex: '-1'
			});
			expect(result.success).toBe(false);
		});

		test('accepts zero values', () => {
			const result = ClaimProofQuerySchema.safeParse({
				depositCount: '0',
				sourceNetworkId: '0',
				leafIndex: '0'
			});
			expect(result.success).toBe(true);
		});

		test('rejects an invalid network with an otherwise-valid query', () => {
			const result = NetworkSchema.safeParse({ network: 'invalid-network' });
			expect(result.success).toBe(false);
		});
	});
});
