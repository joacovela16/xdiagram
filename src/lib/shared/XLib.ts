import {LinkedList} from "./XList";
import type {Callable, HookDispatcher, HookListener, HookManager, XContext} from "./XTypes";
import type {XBound, XEvent, XItem, XPoint} from "./XRender";
import {type Command, HookActionEnum} from "./Instructions";

export function getOrElse<T>(obj: T, other: T): T {
    return isUndefined(obj) ? other : obj;
}

export function isUndefined<T>(obj: T) {
    return obj === undefined || obj === null;
}

export function isDefined<T>(obj: T): boolean {
    return !isUndefined(obj);
}

export function asMap<K, V>(xs: V[], key: (v: V) => K): Map<K, V> {
    const result: Map<K, V> = new Map<K, V>();
    xs.forEach(x => result.set(key(x), x));
    return result;
}

export function setHoverBehavior(dispatcher: XItem, onMouseEnter: (x: XEvent) => void, onMouseLeave: (x: XEvent) => void): void {
    dispatcher.on('mouseenter', onMouseEnter)
    dispatcher.on('mouseleave', onMouseLeave)
}

export function idGen() {
    return Math.floor(Date.now() * Math.random());
}

export function doSnap(p: XPoint, snap: number = 10) {
    return p.divide(snap).round().multiply(snap);
}

export function doNumberSnap(n: number, snap: number = 10) {
    return Math.round(n / snap) * snap;
}

export function cutSegment(end: XPoint, start: XPoint, length: number): XPoint {
    return length === 0 ? start : start.add(end.subtract(start).normalize(length));
}

export function getMinDistance(srcBounds: XBound, trgBounds: XBound): XPoint[] {
    const srcPoints = [
        srcBounds.topCenter,
        srcBounds.rightCenter,
        srcBounds.bottomCenter,
        srcBounds.topLeft,
        srcBounds.topRight,
        srcBounds.bottomRight,
        srcBounds.bottomLeft,
        srcBounds.leftCenter,
    ];

    const trgPoints = [
        trgBounds.topCenter,
        trgBounds.rightCenter,
        trgBounds.bottomCenter,
        trgBounds.topLeft,
        trgBounds.topRight,
        trgBounds.bottomRight,
        trgBounds.bottomLeft,
        trgBounds.leftCenter,
    ];
    let minDist = Number.MAX_SAFE_INTEGER;
    let foundX: XPoint, foundY: XPoint;

    for (let i = 0; i < 8; i++) {
        const x = srcPoints[i];
        for (let j = 0; j < 8; j++) {
            const y = trgPoints[j];
            const distance = x.getDistance(y);
            if (distance < minDist) {
                minDist = distance;
                foundX = x;
                foundY = y;
            }
        }
    }
    return [foundX, foundY];
}

export class Timer {
    private duration: number;
    private timeout;

    constructor(duration: number) {
        this.duration = duration;
    }

    handle(handler: () => void): void {
        const me = this;
        me.clear();
        me.timeout = setTimeout(handler, me.duration);
    }

    clear(): void {
        const me = this;
        me.timeout && clearTimeout(me.timeout);
    }
}

export function doHookBuilder(): HookManager {
    const action: { [index: string]: LinkedList<Function> } = {};
    const filter: { [index: string]: LinkedList<Function> } = {};

    const listener: HookListener = {

        action(name: string, f: Function): Callable {
            const record = (action[name] || (action[name] = new LinkedList())).append(f);
            return () => record.remove();
        },

        filter(name: string, f: Function): Callable {
            const record = (filter[name] || (filter[name] = new LinkedList())).append(f);
            return () => record.remove();
        }
    };

    const dispatcher: HookDispatcher = {
        action(name: string, ...args: any): void {
            (action[name] || (action[name] = new LinkedList())).forEach(x => x(...args))
        },
        filter<T>(name: string, data: T, ...args: any): T {
            const element = filter[name];
            if (element) {
                return element.reduce((prev, cur) => {
                    const datum: T = cur(prev, ...args);
                    return isUndefined(datum) ? prev : datum;
                }, data);
            } else {
                return data;
            }
        }
    };

    return {
        listener,
        dispatcher,
        hasListeners(name: string): boolean {
            const r = (action[name] || filter[name]);
            return r && r.length > 0;
        },
    };
}

export function doIconHovering(iconItem: XItem, context: XContext, hoverColor?: string): XItem {
    const position = context.builder.makePoint(0, 0)
    const builder = context.builder;
    const theme = context.theme;
    const style: CSSStyleDeclaration = context.element.style;

    iconItem.bounds.center = position;
    iconItem.strokeColor = theme.neutral;

    const circle = builder.makeCircle(position, 15);
    circle.fillColor = theme.primaryContent;
    circle.strokeColor = theme.neutral;
    circle.strokeWidth = 2;

    const group = builder.makeGroup([circle, iconItem]);

    setHoverBehavior(group,
        () => {
            circle.fillColor = hoverColor || theme.primaryFocus;
            iconItem.strokeColor = theme.primaryContent;
            style.cursor = 'pointer';
        }, () => {
            circle.fillColor = theme.primaryContent;
            iconItem.strokeColor = theme.neutral;
            style.cursor = 'default';
        });
    return group;
}

export function doLinkZone(bind: XItem, ctx: XContext): void {
    const actionDispatcher = ctx.hookManager.dispatcher.action;
    doHover(bind,
        () => actionDispatcher(HookActionEnum.LINK_ZONE_IN, bind),
        () => actionDispatcher(HookActionEnum.LINK_ZONE_OUT, bind)
    );
}

export function doHover(bind: XItem, inner: (e: XEvent) => void, outer: (e: XEvent) => void) {
    bind.on("mouseenter", e => inner(e));
    bind.on('mouseleave', e => outer(e));
}

export function doReceptor(handlers: { [index in (Command | string)]?: Function }): (n: string, ...arg: any) => void {
    return (name: string, ...args: any) => {
        const h = handlers[name];

        return h && h(...args);
    }
}