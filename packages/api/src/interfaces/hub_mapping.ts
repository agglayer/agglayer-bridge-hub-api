export interface ITokenMetadata {
	originTokenNetwork: number;
	originTokenAddress: string;
	wrappedTokenAddress: string;
	name: string;
	symbol: string;
	decimals: number;
}

export interface IHubTokenMapping {
	blockNumber: number;
	transactionIndex: number;
	timestamp: number;
	transactionHash: string;
	originTokenNetwork: number;
	originTokenAddress: string;
	wrappedTokenNetwork: number;
	wrappedTokenAddress: string;
	lastUpdatedAt: number;
}
