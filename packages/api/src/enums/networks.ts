export const Networks = {
	MAINNET: 'mainnet',
	TESTNET: 'testnet',
	DEVNET: 'devnet'
} as const;
export type Networks = (typeof Networks)[keyof typeof Networks];
