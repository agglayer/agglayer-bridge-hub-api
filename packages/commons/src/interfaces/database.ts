import type { OrderByDirection, WhereFilterOp } from "@google-cloud/firestore";
import type { TransactionStatus } from "../enums/transaction_status";
import type { IBridgeAPIResult } from "./bridge_api_result";
import type { IHubBridgeTransaction } from "./bridge_tx";
import type { IHubClaimTransaction } from "./claim_tx";

export interface IQueryFilterOperationParams {
    field: string;
    operator: WhereFilterOp;
    value: string | number | boolean | string[] | number[];
}

export interface IQueryOrderOperationParams {
    field: string;
    order: OrderByDirection;
}

export interface IDocumentConditionalModifications {
    field: string;
    value: string | number | boolean; // value to set if the field is present already in doc
    defaultValue: string | number | boolean; // default value to set if the field is not present already in doc
}
