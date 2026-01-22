import {
	Logger,
	ConsumerError,
	DatabaseError,
	errorCodes,
	ExternalDependencyError,
	type IRestAPIConsumerConfig,
	RestAPIConsumer,
} from "@polygonlabs/servercore";
import type { IBridgeTx } from "./interfaces/bridge_tx";
import type {
	ILastIndexedBridgeTransaction,
	ILastIndexedClaimTransaction,
	ILastIndexedMappingTransaction,
} from "./interfaces/metadata";
import type { IClaimTx } from "./interfaces/claim_tx";
import type { IMappingTx } from "./interfaces/token_mapping";
import type TransactionMapper from "./mappers/transaction";
import type TokenMappingsMapper from "./mappers/mapping";
import type MetadataMapper from "./mappers/metadata";
import type TransactionsService from "./services/transaction";
import type TokenMappingsService from "./services/mapping";
import type MetadataService from "./services/metadata";
import { MetadataFields } from "./enums/metadata_fields";

export class BridgeAPIConsumer {
	private bridgeConsumer:
		| RestAPIConsumer<IBridgeTx[], ILastIndexedBridgeTransaction>
		| undefined = undefined;
	private claimConsumer:
		| RestAPIConsumer<IClaimTx[], ILastIndexedClaimTransaction>
		| undefined = undefined;
	private mappingConsumer:
		| RestAPIConsumer<IMappingTx[], ILastIndexedMappingTransaction>
		| undefined = undefined;

	constructor(
		private readonly bridgeConsumerConfig: IRestAPIConsumerConfig,
		private readonly claimConsumerConfig: IRestAPIConsumerConfig,
		private readonly mappingConsumerConfig: IRestAPIConsumerConfig,
		private readonly transactionMapper: TransactionMapper,
		private readonly tokenMappingsMapper: TokenMappingsMapper,
		private readonly metadataMapper: MetadataMapper,
		private readonly transactionService: TransactionsService,
		private readonly tokenMappingsService: TokenMappingsService,
		private readonly metadataService: MetadataService
	) {}

	public async start(): Promise<void> {
		this.bridgeConsumer = new RestAPIConsumer<
			IBridgeTx[],
			ILastIndexedBridgeTransaction
		>(this.bridgeConsumerConfig);
		this.claimConsumer = new RestAPIConsumer<
			IClaimTx[],
			ILastIndexedClaimTransaction
		>(this.claimConsumerConfig);
		this.mappingConsumer = new RestAPIConsumer<
			IMappingTx[],
			ILastIndexedMappingTransaction
		>(this.mappingConsumerConfig);

		this.bridgeConsumer.setStartValue(
			await this.getStartValues(
				MetadataFields.LAST_INDEXED_BRIDGE_DEPOSIT_COUNT
			)
		);
		this.claimConsumer.setStartValue(
			await this.getStartValues(
				MetadataFields.LAST_INDEXED_CLAIM_BLOCK_NUMBER
			)
		);
		this.mappingConsumer.setStartValue(
			await this.getStartValues(
				MetadataFields.LAST_INDEXED_MAPPING_BLOCK_NUMBER
			)
		);

		await Promise.all([
			// start bridge consumer
			this.bridgeConsumer.start({
				next: async (data) => this.onBridgeData(data),
				summary: async (data: ILastIndexedBridgeTransaction) =>
					this.onBridgeDataSummary(data),
				error: (err: ConsumerError | ExternalDependencyError) =>
					this.onError("bridge-consumer", err),
				closed: () => this.onClosed("bridge-consumer"),
			}),

			// start claim consumer
			this.claimConsumer.start({
				next: async (data) => this.onClaimData(data),
				summary: async (data: ILastIndexedClaimTransaction) =>
					this.onClaimDataSummary(data),
				error: (err: ConsumerError | ExternalDependencyError) =>
					this.onError("claim-consumer", err),
				closed: () => this.onClosed("claim-consumer"),
			}),

			// start mapping consumer
			this.mappingConsumer.start({
				next: async (data) => this.onMappingData(data),
				summary: async (data: ILastIndexedMappingTransaction) =>
					this.onMappingDataSummary(data),
				error: (err: ConsumerError | ExternalDependencyError) =>
					this.onError("mapping-consumer", err),
				closed: () => this.onClosed("mapping-consumer"),
			}),
		]);
	}

	private async onBridgeData(data: IBridgeTx[]): Promise<void> {
		try {
			const mappedTransactions =
				this.transactionMapper.mapBridgeTransactions(data);
			await this.transactionService.saveBridges(mappedTransactions);
		} catch (error) {
			if (error instanceof DatabaseError) {
				throw error;
			}
			Logger.error({
				location: "bridge_api_consumer",
				function: "onBridgeData",
				status: `ERROR encountered on bridge consumer`,
				error: error,
			});
			throw new ConsumerError(
				`Error in onBridgeData : ${(error as Error).message}`,
				{
					isFatal: true,
					code: errorCodes.consumer.UNKNOWN_CONSUMER_ERR,
					context: {
						error: error as Error,
					},
				}
			);
		}
	}

	private async onBridgeDataSummary(
		data: ILastIndexedBridgeTransaction
	): Promise<void> {
		try {
			const mappedMetadata =
				this.metadataMapper.mapLastIndexedBridgeTx(data);
			await this.metadataService.saveLastIndexedTxs(mappedMetadata);
		} catch (error) {
			if (error instanceof DatabaseError) {
				throw error;
			}
			Logger.error({
				location: "bridge_api_consumer",
				function: "onBridgeDataSummary",
				status: `ERROR encountered on mapping consumer`,
				error: error,
			});
			throw new ConsumerError(
				`Error in onMappingData : ${(error as Error).message}`,
				{
					isFatal: true,
					code: errorCodes.consumer.UNKNOWN_CONSUMER_ERR,
					context: {
						error: error as Error,
					},
				}
			);
		}
	}

	private async onClaimData(data: IClaimTx[]): Promise<void> {
		try {
			const mappedTransactions =
				this.transactionMapper.mapClaimTransactions(data);
			await this.transactionService.saveClaims(mappedTransactions);
		} catch (error) {
			if (error instanceof DatabaseError) {
				throw error;
			}
			Logger.error({
				location: "bridge_api_consumer",
				function: "onClaimData",
				status: `ERROR encountered on claim consumer`,
				error: error,
			});
			throw new ConsumerError(
				`Error in onClaimData : ${(error as Error).message}`,
				{
					isFatal: true,
					code: errorCodes.consumer.UNKNOWN_CONSUMER_ERR,
					context: {
						error: error as Error,
					},
				}
			);
		}
	}

	private async onClaimDataSummary(
		data: ILastIndexedClaimTransaction
	): Promise<void> {
		try {
			const mappedMetadata =
				this.metadataMapper.mapLastIndexedClaimTx(data);
			await this.metadataService.saveLastIndexedTxs(mappedMetadata);
		} catch (error) {
			if (error instanceof DatabaseError) {
				throw error;
			}
			Logger.error({
				location: "bridge_api_consumer",
				function: "onClaimDataSummary",
				status: `ERROR encountered on claim consumer`,
				error: error,
			});
			throw new ConsumerError(
				`Error in onClaimData : ${(error as Error).message}`,
				{
					isFatal: true,
					code: errorCodes.consumer.UNKNOWN_CONSUMER_ERR,
					context: {
						error: error as Error,
					},
				}
			);
		}
	}

	private async onMappingData(data: IMappingTx[]): Promise<void> {
		try {
			const mappedTransactions =
				this.tokenMappingsMapper.mapMappings(data);
			await this.tokenMappingsService.saveTokenMappings(
				mappedTransactions
			);
		} catch (error) {
			if (error instanceof DatabaseError) {
				throw error;
			}
			Logger.error({
				location: "bridge_api_consumer",
				function: "onMappingData",
				status: `ERROR encountered on mapping consumer`,
				error: error,
			});
			throw new ConsumerError(
				`Error in onMappingData : ${(error as Error).message}`,
				{
					isFatal: true,
					code: errorCodes.consumer.UNKNOWN_CONSUMER_ERR,
					context: {
						error: error as Error,
					},
				}
			);
		}
	}

	private async onMappingDataSummary(
		data: ILastIndexedMappingTransaction
	): Promise<void> {
		try {
			const mappedMetadata =
				this.metadataMapper.mapLastIndexedMappingTx(data);
			await this.metadataService.saveLastIndexedTxs(mappedMetadata);
		} catch (error) {
			if (error instanceof DatabaseError) {
				throw error;
			}
			Logger.error({
				location: "bridge_api_consumer",
				function: "onMappingDataSummary",
				status: `ERROR encountered on mapping consumer`,
				error: error,
			});
			throw new ConsumerError(
				`Error in onClaimData : ${(error as Error).message}`,
				{
					isFatal: true,
					code: errorCodes.consumer.UNKNOWN_CONSUMER_ERR,
					context: {
						error: error as Error,
					},
				}
			);
		}
	}

	private async getStartValues(field: MetadataFields): Promise<number> {
		const metadataDoc = await this.metadataService.getLastIndexedTxs();
		return metadataDoc?.[field] ?? 0;
	}

	private onError(
		consumerName: string,
		err: ConsumerError | ExternalDependencyError | Error
	): void {
		Logger.error({
			location: "bridge_api_consumer",
			status: `ERROR encountered on ${consumerName} consumer`,
			error: err,
		});
	}

	private onClosed(consumerName: string): void {
		Logger.warn(`${consumerName} consumer has closed.`);
	}
}
