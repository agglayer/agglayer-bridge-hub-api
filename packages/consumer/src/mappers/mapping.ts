import type { IHubTokenMappings, IMappingTx } from '../interfaces/token_mapping.ts';

export class TokenMappingsMapper {
	private readonly networkId: number;

	constructor(networkId: number) {
		this.networkId = networkId;
	}

	public mapMappings(events: IMappingTx[]): IHubTokenMappings[] {
		const formattedMappings: IHubTokenMappings[] = [];
		events.forEach((mappingEvent) => {
			formattedMappings.push({
				blockNumber: mappingEvent.block_num,
				transactionIndex: mappingEvent.block_pos,
				timestamp: mappingEvent.block_timestamp,
				transactionHash: mappingEvent.tx_hash.toLowerCase(),
				originTokenNetwork: mappingEvent.origin_network,
				originTokenAddress: mappingEvent.origin_token_address.toLowerCase(),
				wrappedTokenNetwork: this.networkId,
				wrappedTokenAddress: mappingEvent.wrapped_token_address.toLowerCase(),
				lastUpdatedAt: Date.now()
			});
		});

		return formattedMappings;
	}
}
