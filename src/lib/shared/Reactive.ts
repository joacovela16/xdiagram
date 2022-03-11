import {LinkedList} from "./XList";
import type {Callable} from "./XTypes";

type Subscriber<T> = (x: T) => void

interface IReactive<T> {
    subscribe(subs: Subscriber<T>): Callable

    get(): T;

    set(v: T): void;
}

class Reactive<T> implements IReactive<T> {
    private subscribers: LinkedList<Subscriber<T>>;
    private value?: T;

    constructor(initial?: T) {
        this.value = initial;
        this.subscribers = new LinkedList<Subscriber<T>>();
    }

    get(): T {
        return this.value;
    }

    set(v: T): void {
        this.value = v;
        this.subscribers.forEach(x => x(v));
    }

    subscribe(subs: Subscriber<T>): Callable {
        const record = this.subscribers.push(subs);
        this.value && subs(this.value);
        return () => record.remove();
    }

    clean(): void {
        this.subscribers.clean();
    }

}

export default function doReactive<T>(initial?: T): Reactive<T> {
    return new Reactive<T>(initial);
}