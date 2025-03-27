import type { IBridgeAPIResult } from "./bridge_api_result";
import type { IClaimTx } from "./claim_tx";

export interface IClaimsBridgeAPIResult extends IBridgeAPIResult {
    claims: IClaimTx[];
}
