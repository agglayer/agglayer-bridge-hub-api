/**
 * Registry composition for the Bridge Hub API.
 *
 * `TypedRegistry` accumulates every registered operation into its type via
 * chained `.with(fn)` calls. `buildRegistry`'s inferred return type is what
 * `Operations` (below) derives from — the OpenAPI spec, the registry-driven
 * Express router's request/response validation, and the typed handler
 * binding in each controller all read from this one accumulated manifest.
 *
 * To add a new route: append a `.registerPath({...})` call inside the
 * relevant `addXRoutes` helper under `./routes/`, or add a new domain
 * helper and `.with(addNewDomainRoutes)` here.
 */

import { TypedRegistry } from '@polygonlabs/openapi-registry';

import { addHealthCheckRoutes } from './routes/health_check.ts';
import { addMappingsRoutes } from './routes/mappings.ts';
import { addProofRoutes } from './routes/proof.ts';
import { addTokenMetadataRoutes } from './routes/token_metadata.ts';
import { addTransactionsRoutes } from './routes/transactions.ts';

export const buildRegistry = () =>
	new TypedRegistry()
		.with(addHealthCheckRoutes)
		.with(addTransactionsRoutes)
		.with(addMappingsRoutes)
		.with(addProofRoutes)
		.with(addTokenMetadataRoutes);

export type Operations =
	ReturnType<typeof buildRegistry> extends TypedRegistry<infer O, Record<string, true>> ? O : never;
