export * from './types';
export * from './handler';

export function asyncHandler<T>(
    fn: (...args: any[]) => Promise<T>
): (...args: any[]) => Promise<any> {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            const next = args[args.length - 1];
            if (typeof next === 'function') {
                next(error);
            } else {
                throw error;
            }
        }
    };
}

export function withTimeout<T>(
    operation: string,
    timeoutMs: number,
    fn: () => Promise<T>
): () => Promise<T> {
    return async () => {
        const { TimeoutError } = await import('./types');

        return new Promise<T>((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new TimeoutError(operation, timeoutMs));
            }, timeoutMs);

            fn()
                .then((result) => {
                    clearTimeout(timer);
                    resolve(result);
                })
                .catch((error) => {
                    clearTimeout(timer);
                    reject(error);
                });
        });
    };
}