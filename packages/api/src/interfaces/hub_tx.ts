import type { IHubBridgeTransaction } from "./bridge_tx";
import type { IHubClaimTransaction } from "./claim_tx";

export interface IHubTransaction
	extends IHubClaimTransaction,
		IHubBridgeTransaction {}
