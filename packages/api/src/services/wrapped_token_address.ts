import { concat, encodeAbiParameters, encodePacked, getContractAddress, keccak256 } from 'viem';

import { WRAPPED_TOKEN_V1_INIT_BYTECODE } from '../constants/bridge.ts';

/**
 * Address the pre-upgradeable ("V1") bridge deploys a token's wrapper at.
 *
 * Mirrors the bridge contract's `precalculatedWrapperAddress` view, which is a pure
 * CREATE2 derivation from its inputs and the bridge's own address. Computing it here
 * rather than calling the view keeps token metadata independent of any single chain's
 * RPC: the lookup used to go to Polygon zkEVM, and kept every metadata request tied to
 * that chain's RPC after the network was sunset.
 */
export const computeWrappedAddressV1 = ({
	bridgeAddress,
	originTokenNetwork,
	originTokenAddress,
	name,
	symbol,
	decimals
}: {
	bridgeAddress: string;
	originTokenNetwork: number;
	originTokenAddress: string;
	name: string;
	symbol: string;
	decimals: number;
}): string =>
	getContractAddress({
		opcode: 'CREATE2',
		from: bridgeAddress as `0x${string}`,
		salt: keccak256(
			encodePacked(['uint32', 'address'], [originTokenNetwork, originTokenAddress as `0x${string}`])
		),
		bytecodeHash: keccak256(
			concat([
				WRAPPED_TOKEN_V1_INIT_BYTECODE,
				encodeAbiParameters(
					[{ type: 'string' }, { type: 'string' }, { type: 'uint8' }],
					[name, symbol, decimals]
				)
			])
		)
	});
