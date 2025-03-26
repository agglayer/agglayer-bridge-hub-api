import type { ConsumerError } from "bridge-hub-commons/errors/consumer_errors";
import { EventEmitter } from "events";

declare class EventConsumer extends EventEmitter {
    /**
     * @public
     *
     * Method to register listener for events. The Abstract Event Consumer emits fatalError
     * event.
     *
     * @param {"fatalError"} eventName - Event name to register listener for.
     * @param listener - Listener to be called when emitting the event.
     *
     * @returns {this} - Returns an instance of the class.
     */
    on(
        eventName: "fatalError",
        listener: (error: Error | ConsumerError) => void
    ): this;
    /**
     * @public
     *
     * Method to register listener for events that will be called only once. The Abstract Event Consumer emits fatalError
     * event.
     *
     * @param {"fatalError"} eventName - Event name to register listener for.
     * @param listener - Listener to be called when emitting the event.
     *
     * @returns {this} - Returns an instance of the class.
     */
    once(
        eventName: "fatalError",
        listener: (error: Error | ConsumerError) => void
    ): this;
    protected onFatalError(error: Error | ConsumerError): void;
}

export { EventConsumer };
