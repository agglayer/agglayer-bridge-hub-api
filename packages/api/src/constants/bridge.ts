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
] as const;
