import type {
    IHubTokenMappings,
    IMappingTx,
} from "bridge-hub-commons/interfaces/token_mapping";

export default class TokenMappingsMapper {
    constructor(private networkId: number) {}

    public mapMappings(events: IMappingTx[]): IHubTokenMappings[] {
        const formattedMappings: IHubTokenMappings[] = [];
        events.forEach((mappingEvent) => {
            formattedMappings.push({
                metadata: mappingEvent.metadata,
                blockNumber: mappingEvent.block_num,
                transactionIndex: mappingEvent.block_pos,
                timestamp: mappingEvent.block_timestamp,
                transactionHash: mappingEvent.tx_hash.toLowerCase(),
                originTokenNetwork: mappingEvent.origin_network,
                originTokenAddress:
                    mappingEvent.origin_token_address.toLowerCase(),
                wrappedTokenNetwork: this.networkId,
                wrappedTokenAddress:
                    mappingEvent.wrapped_token_address.toLowerCase(),
            });
        });

        return formattedMappings;
    }
}
