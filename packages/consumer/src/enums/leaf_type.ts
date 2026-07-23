/**
 * Leaf type of bridge events.
 */
export const LeafType = {
	ASSET: 0,
	MESSAGE: 1
} as const;
export type LeafType = (typeof LeafType)[keyof typeof LeafType];
