import type { IBridgeAPIResult } from "./bridge_api_result";
import type { IMappingTx } from "./mapping_tx";

export interface IMappingsBridgeAPIResult extends IBridgeAPIResult {
    tokenMappings: IMappingTx[];
}
