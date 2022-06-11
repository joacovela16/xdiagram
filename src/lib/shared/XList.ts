import {isUndefined} from "./XLib";
import doOption, {Option} from "./Option";
import {append} from "tiny-svg";

export class Record<T> {
    previous: Record<T>
    data: T;
    next: Record<T>;
    private active: boolean = true;
    private belongTo: LinkedList<T>;

    constructor(previous: Record<T>, data: T, next: Record<T>, belongTo: LinkedList<T>) {
        const me = this;
        me.previous = previous;
        me.data = data;
        me.next = next;
        me.belongTo = belongTo;
    }

    remove(): void {
        const me = this;
        if (me.active) {
            me.active = false;
            me.belongTo.remove(me);
        }
    }

    getAndRemove(f: (x: T) => void): void {
        const me = this;
        f(me.data);
        me.remove();
    }
}

export class LinkedList<T> {
    first: Record<T>;
    last: Record<T>;
    length: number = 0;

    constructor() {
    }

    push(data: T): Record<T> {
        return this.append(data);
    }

    append(data: T): Record<T> {
        const me: LinkedList<T> = this;
        const record: Record<T> = new Record<T>(null, data, null, me);
        if (this.length === 0) {
            me.first = record
            me.last = record
        } else {
            const last: Record<T> = me.last;
            last.next = record;
            record.previous = last;
            me.last = record;
        }
        me.length++;
        return record;
    }

    addAll(data: T[]): void {
        const me = this;
        data.forEach(x => me.append(x));
    }

    prepend(data: T): Record<T> {
        const me: LinkedList<T> = this;
        const record: Record<T> = new Record<T>(null, data, null, me);
        const first: Record<T> = me.first;
        if (isUndefined(first)) {
            me.first = record;
            me.last = record;
        } else {
            record.next = first;
            first.previous = record;
            me.first = record;
        }
        me.length++;
        return record;
    }

    isEmpty(): boolean {
        return this.length === 0;
    }

    remove(record: Record<T>): void {
        const me: LinkedList<T> = this;

        if (me.isEmpty()) return;

        const previous: Record<T> = record.previous;
        const next: Record<T> = record.next;

        if (isUndefined(previous)) {
            me.first = next;
            if (isUndefined(next)) {
                me.last = null;
            } else {
                next.previous = null;
            }
        } else {
            previous.next = next;
            if (isUndefined(next)) {
                me.last = previous;
            } else {
                next.previous = previous;
            }
        }
        me.length--;
    }

    reduce<B>(h: (acc: B, item: T) => B, initial: B): B {
        let item: B = initial;
        let current: Record<T> = this.first;
        while (current) {
            item = h(item, current.data);
            current = current.next;
        }
        return item;
    }

    exists(p: (item: T) => boolean): boolean {
        return this.find(p).isDefined();
    }

    map<U>(f: (x: T) => U): LinkedList<U> {
        const result = new LinkedList<U>();
        this.forEach(x => result.append(f(x)));
        return result;
    }

    filter(f: (x: T) => boolean): LinkedList<T> {
        const result = new LinkedList<T>();
        this.forEach(x => f(x) && result.append(x));
        return result;
    }

    find(p: (item: T) => boolean): Option<T> {
        const record = this.findRecord(p);
        return record.map(x => x.data);
    }

    findAndRemove(p: (x: T) => boolean): boolean {
        const r = this.findRecord(p);
        r.foreach(x => x.remove());
        return r.isDefined();
    }

    insertAt(index: number, data: T): void {

        if (this.isEmpty()) {
            this.append(data);
            return;
        }

        let i = 0;
        let item = this.first;
        while (i < index && item) {
            item = item.next;
            i++;
        }
        // console.log(item && i === index)
        // console.log(index >= i)
        if (item && i === index) {
            const r = new Record<T>(item.previous, data, item, this);
            item.previous && (item.previous.next = r);
            item.previous = r;
            this.length += 1;
            if (index === 0){
               this.first = r;
            }
        }else if (index >= i){
            const r = new Record<T>(this.last, data, null, this);
            this.length += 1;
            this.last.next = r;
            this.last = r;
        }
    }

    findRecord(p: (item: T) => boolean): Option<Record<T>> {
        let first: Record<T> = this.first;
        while (first) {
            if (p(first.data)) {
                return doOption(first);
            }
            first = first.next;
        }
        return doOption();
    }

    forEach(f: (x: T) => void): void {
        const me: LinkedList<T> = this;
        let first: Record<T> = me.first;
        while (first) {
            f(first.data)
            first = first.next;
        }
    }

    clean(): void {
        this.first = null;
        this.last = null;
        this.length = 0;
    }

    toArray(): T[] {
        const result: T[] = [];
        this.forEach(x => result.push(x));
        return result;
    }
}