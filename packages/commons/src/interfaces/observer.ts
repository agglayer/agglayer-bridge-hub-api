export interface IObserver<T, E, U> {
    next: (value: T) => Promise<void> | void;
    summary: (value: U) => Promise<void> | void;
    error: (value: E) => void;
    closed: () => void;
}
