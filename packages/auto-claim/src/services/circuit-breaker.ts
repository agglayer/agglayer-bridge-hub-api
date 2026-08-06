/**
 * Tracks consecutive claim-proof/claim-submission failures per (sourceNetwork, depositCount)
 * and trips a breaker once a transaction has failed enough times in a row to be considered
 * permanently stuck.
 *
 * Exists because auto-claim previously retried every READY_TO_CLAIM transaction on every poll
 * tick forever, with no memory of past failures. A backlog of transactions whose claim-proof
 * can never be produced (e.g. a stuck source-network indexer) turned into a permanent 404 storm
 * against the Bridge Hub API, since nothing ever stopped re-requesting them. Deliberately
 * in-memory only (no new storage) — losing the breaker state on a restart just costs one more
 * round of failures before it re-trips, which is an acceptable tradeoff for not adding a
 * persistence dependency to a daemon that already re-derives all its state from the API.
 */
export interface ClaimCircuitBreakerOptions {
	/** Consecutive failures before a transaction is skipped. */
	failureThreshold?: number;
	/** Ticks a tripped transaction stays skipped before one retry attempt is allowed. */
	retryWindowTicks?: number;
}

interface BreakerEntry {
	consecutiveFailures: number;
	tripped: boolean;
	ticksSinceTrip: number;
}

export class ClaimCircuitBreaker {
	private readonly failureThreshold: number;
	private readonly retryWindowTicks: number;
	private readonly entries = new Map<string, BreakerEntry>();

	constructor(options: ClaimCircuitBreakerOptions = {}) {
		this.failureThreshold = options.failureThreshold ?? 15;
		this.retryWindowTicks = options.retryWindowTicks ?? 120;
	}

	static keyFor(sourceNetwork: number, depositCount: number): string {
		return `${sourceNetwork}:${depositCount}`;
	}

	/**
	 * Whether the transaction identified by `key` should be skipped this tick. A tripped entry
	 * still gets exactly one retry attempt every `retryWindowTicks` ticks, so a claim-proof that
	 * starts succeeding again (e.g. the source-network indexer catches up) is picked back up
	 * without manual intervention. Calling this advances that entry's tick counter as a
	 * side effect, so callers must call it at most once per transaction per tick.
	 */
	shouldSkip(key: string): boolean {
		const entry = this.entries.get(key);
		if (!entry?.tripped) {
			return false;
		}

		entry.ticksSinceTrip += 1;
		if (entry.ticksSinceTrip >= this.retryWindowTicks) {
			entry.ticksSinceTrip = 0;
			return false;
		}
		return true;
	}

	/**
	 * Records a failed claim-proof lookup or claim submission for `key`. Returns `true` only on
	 * the tick where the breaker transitions from closed to tripped, so callers can log a single
	 * warn on the transition rather than once per failure.
	 */
	recordFailure(key: string): boolean {
		const entry = this.entries.get(key) ?? {
			consecutiveFailures: 0,
			tripped: false,
			ticksSinceTrip: 0
		};

		entry.consecutiveFailures += 1;
		const justTripped = !entry.tripped && entry.consecutiveFailures >= this.failureThreshold;
		if (justTripped) {
			entry.tripped = true;
			entry.ticksSinceTrip = 0;
		}

		this.entries.set(key, entry);
		return justTripped;
	}

	/** Clears all failure/trip state for `key` following a successful claim. */
	recordSuccess(key: string): void {
		this.entries.delete(key);
	}
}
