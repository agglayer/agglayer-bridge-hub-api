import type { OrderByDirection, WhereFilterOp } from "@google-cloud/firestore";
import type { TransactionStatus } from "../enums/transaction_status";
import type { IBridgeAPIResult } from "./bridge_api_result";

export interface IQueryFilterOperationParams {
    field: string;
    operator: WhereFilterOp;
    value: string | number | boolean;
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

export interface IHubBridgeTransaction {}
