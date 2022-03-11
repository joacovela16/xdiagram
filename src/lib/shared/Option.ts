import {isUndefined} from "./XLib";

export abstract class Option<T> {
    abstract isDefined(): boolean

    abstract isEmpty(): boolean

    abstract foreach(p: (x: T) => void): void;

    abstract map<U>(p: (x: T) => U): Option<U>;

    abstract filter(p: (x: T) => boolean): Option<T>;

    abstract exists<U>(p: (x: T) => boolean): boolean;

    abstract flatMap<U>(p: (x: T) => Option<U>): Option<U>;

    abstract getOrElse(other: T): T;

    abstract fold<U>(found: (x: T) => U, missing: () => U): U;
}

class None<T> extends Option<T> {
    fold<U>(found: (x: T) => U, missing: () => U): U {
        return missing();
    }

    isDefined(): boolean {
        return false;
    }

    filter(p: (x: T) => boolean): Option<T> {
        return this;
    }

    isEmpty(): boolean {
        return true;
    }

    getOrElse(other: T): T {
        return other;
    }

    flatMap<U>(p: (x: T) => Option<U>): Option<U> {
        return new None();
    }

    foreach(p: (x: T) => void): void {
    }

    map<U>(p: (x: T) => U): Option<U> {
        return new None();
    }

    exists<U>(p: (x: T) => boolean): boolean {
        return false;
    }
}

class Some<T> extends Option<T> {
    private value: T;

    constructor(value: T) {
        super();
        if (isUndefined(value)) throw Error('Empty value exception');
        this.value = value;
    }

    filter(p: (x: T) => boolean): Option<T> {
        return p(this.value) ? this : new None<T>();
    }

    exists<U>(p: (x: T) => boolean): boolean {
        return p(this.value);
    }

    fold<U>(found: (x: T) => U, missing: () => U): U {
        return found(this.value);
    }

    getOrElse(other: T): T {
        return this.value;
    }

    flatMap<U>(p: (x: T) => Option<U>): Option<U> {
        return p(this.value);
    }

    foreach(p: (x: T) => void): void {
        p(this.value);
    }

    map<U>(p: (x: T) => U): Option<U> {
        const c = p(this.value);
        return isUndefined(c) ? new None() : new Some(c);
    }

    isDefined(): boolean {
        return true;
    }

    isEmpty(): boolean {
        return false;
    }
}

export default function doOption<T>(value?: T): Option<T> {
    return isUndefined(value) ? new None() : new Some(value);
}
