import type { IBridgeAPIResult } from "./bridge_api_result";
import type { IBridgeTx } from "./bridge_tx";

export interface IBridgesBridgeAPIResult extends IBridgeAPIResult {
    bridges: IBridgeTx;
}
