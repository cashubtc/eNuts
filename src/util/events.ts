export type EventHandler<T> = (payload: T) => void;

export class EventEmitter<T extends Record<string, any>> {
    private listeners: { [K in keyof T]?: EventHandler<T[K]>[] } = {};

    on<K extends keyof T>(event: K, handler: EventHandler<T[K]>) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event]!.push(handler);
    }

    off<K extends keyof T>(event: K, handler: EventHandler<T[K]>) {
        if (!this.listeners[event]) {
            return;
        }
        this.listeners[event] = this.listeners[event]!.filter(
            (h) => h !== handler
        );
    }

    emit<K extends keyof T>(event: K, payload: T[K]) {
        if (!this.listeners[event]) {
            return;
        }
        this.listeners[event]!.forEach((cb) => cb(payload));
    }
}

export const proofEvents = new EventEmitter<{
    proofsUpdated: null;
}>();
