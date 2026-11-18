import { describe, test, expect } from 'vitest';

import { computeWrappedAddressV1 } from '../../src/services/wrapped_token_address.ts';

const MAINNET_BRIDGE = '0x2a3DD3EB832aF982ec71669E178424b10Dca2EDe';

// Expected values are what the bridge contract's own `precalculatedWrapperAddress`
// returned on-chain for these inputs (identical on every chain that exposes it),
// so a mismatch here means the local derivation has drifted from the contract.
const ON_CHAIN_VECTORS = [
	{
		originTokenNetwork: 0,
		originTokenAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
		name: 'Wrapped BTC',
		symbol: 'WBTC',
		decimals: 8,
		expected: '0xEA034fb02eB1808C2cc3adbC15f447B93CbE08e1'
	},
	{
		originTokenNetwork: 0,
		originTokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
		name: 'USD Coin',
		symbol: 'USDC',
		decimals: 6,
		expected: '0xA8CE8aee21bC2A48a5EF670afCc9274C7bbbC035'
	},
	{
		originTokenNetwork: 0,
		originTokenAddress: '0x2C24B57e2CCd1f273045Af6A5f632504C432374F',
		name: 'Vault Bridge WBTC',
		symbol: 'vbWBTC',
		decimals: 8,
		expected: '0x593A86cB824e0e3546fAE6bbC56e6f3f3EB6213E'
	},
	{
		originTokenNetwork: 20,
		originTokenAddress: '0x7F1f4b4b29f5058fA32CC7a97141b8D7e5ABDC2d',
		name: 'Katana',
		symbol: 'KAT',
		decimals: 18,
		expected: '0x55C075068ce7DDE41E0d5f2F63B0C4Ce5CB51862'
	},
	{
		originTokenNetwork: 3,
		originTokenAddress: '0x1E4a5963aBFD975d8c9021ce480b42188849D41d',
		name: 'Some "odd" näme',
		symbol: 'ODD',
		decimals: 0,
		expected: '0xc506F299a23C315cE3C0B67f1557Dc0C39622346'
	}
];

describe('computeWrappedAddressV1', () => {
	test.each(ON_CHAIN_VECTORS)(
		'matches the on-chain result for $symbol (origin network $originTokenNetwork)',
		({ expected, ...token }) => {
			expect(computeWrappedAddressV1({ bridgeAddress: MAINNET_BRIDGE, ...token })).equal(expected);
		}
	);

	test('depends on the bridge address, so each environment gets its own wrapped address', () => {
		const { expected, ...token } = ON_CHAIN_VECTORS[0];
		expect(
			computeWrappedAddressV1({
				bridgeAddress: '0x528e26b25a34a4A5d0dbDa1d57D318153d2ED582',
				...token
			})
		).not.equal(expected);
	});
});
