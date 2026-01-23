// Static configuration and cached environment variables

const BRIDGE_ADDRESSES = new Map([
	["mainnet", "0x2a3DD3EB832aF982ec71669E178424b10Dca2EDe"],
	["testnet", "0x528e26b25a34a4A5d0dbDa1d57D318153d2ED582"],
	["devnet", "0x1348947e282138d8f377b467F7D9c2EB0F335d1f"],
]);

const TRANSACTIONS_COLLECTIONS = new Map([
	["mainnet", "bridge_hub_api_transactions"],
	["testnet", "bridge_hub_api_transactions_testnet"],
	["devnet", "bridge_hub_api_transactions_devnet"],
]);

const MAPPINGS_COLLECTIONS = new Map([
	["mainnet", "bridge_hub_api_mappings"],
	["testnet", "bridge_hub_api_mappings_testnet"],
	["devnet", "bridge_hub_api_mappings_devnet"],
]);

export { BRIDGE_ADDRESSES, TRANSACTIONS_COLLECTIONS, MAPPINGS_COLLECTIONS };
