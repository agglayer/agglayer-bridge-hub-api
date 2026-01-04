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
