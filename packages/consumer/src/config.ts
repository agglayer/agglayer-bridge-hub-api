// Static configuration and cached environment variables

const BRIDGE_ADDRESSES = new Map([
	["mainnet", "0x2a3DD3EB832aF982ec71669E178424b10Dca2EDe"],
	["testnet", "0x528e26b25a34a4A5d0dbDa1d57D318153d2ED582"],
	["testnet", "0x1348947e282138d8f377b467F7D9c2EB0F335d1f"],
]);

const COLLECTIONS_CONFIG = new Map([
	[
		"mainnet",
		{
			transactions: "bridge_hub_api_transactions",
			tokenMappings: "bridge_hub_api_mappings",
			metadata: "bridge_hub_api_metadata",
		},
	],
	[
		"testnet",
		{
			transactions: "bridge_hub_api_transactions_testnet",
			tokenMappings: "bridge_hub_api_mappings_testnet",
			metadata: "bridge_hub_api_metadata_testnet",
		},
	],
	[
		"devnet",
		{
			transactions: "bridge_hub_api_transactions_devnet",
			tokenMappings: "bridge_hub_api_mappings_devnet",
			metadata: "bridge_hub_api_metadata_devnet",
		},
	],
]);

export { BRIDGE_ADDRESSES, COLLECTIONS_CONFIG };
