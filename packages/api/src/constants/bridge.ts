export const BRIDGE_ABI_V2 = [
	{
		inputs: [
			{ internalType: "uint32", name: "originNetwork", type: "uint32" },
			{
				internalType: "address",
				name: "originTokenAddress",
				type: "address",
			},
		],
		name: "computeTokenProxyAddress",
		outputs: [{ internalType: "address", name: "", type: "address" }],
		stateMutability: "view",
		type: "function",
	},
];

export const BRIDGE_ABI_V1 = [
	{
		constant: false,
		inputs: [
			{ internalType: "uint32", name: "originNetwork", type: "uint32" },
			{
				internalType: "address",
				name: "originTokenAddress",
				type: "address",
			},
			{ internalType: "string", name: "name", type: "string" },
			{ internalType: "string", name: "symbol", type: "string" },
			{ internalType: "uint8", name: "decimals", type: "uint8" },
		],
		name: "precalculatedWrapperAddress",
		outputs: [{ internalType: "address", name: "", type: "address" }],
		payable: false,
		stateMutability: "view",
		type: "function",
	},
];
